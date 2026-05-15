"""AuthorService — generate a full Scenario JSON from a one-line brief.

Workflow:
1. Build user message from AuthorRequest.
2. MOCK_AI=true → return canned scenario immediately, write to disk, done.
3. Otherwise → call Ollama with author_scenario.txt system prompt, format=json.
4. Parse + validate against Scenario Pydantic model. ONE retry on failure.
5. Slugify title, ensure uniqueness, write scenarios/{slug}.json.
6. Invalidate ScenarioService cache.
7. Fire background image generation tasks (non-blocking).
8. Return scenario.
"""
from __future__ import annotations

import asyncio
import json
import logging
import math
import re
from pathlib import Path

from pydantic import ValidationError

from app.core.config import get_settings
from app.modules.author.schemas import AuthorRequest
from app.modules.images.service import ImageGenService
from app.modules.scenarios.schemas import Choice, Scenario, ScenarioStep
from app.modules.scenarios.service import ScenarioService

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent / "prompts" / "author_scenario.txt"
_AUTHOR_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _unique_slug(slug: str, scenarios_dir: Path) -> str:
    """Return slug, appending -2, -3, … until no collision with disk files."""
    candidate = slug
    counter = 2
    while (scenarios_dir / f"{candidate}.json").exists():
        candidate = f"{slug}-{counter}"
        counter += 1
    return candidate


def _build_user_message(req: AuthorRequest) -> str:
    return (
        f"skill_domain={req.skill_domain}, "
        f"brief=\"{req.brief}\", "
        f"difficulty={req.difficulty}, "
        f"num_steps={req.num_steps}, "
        f"language={req.language}"
    )


def _make_canned_scenario(req: AuthorRequest, scenarios_dir: Path) -> Scenario:
    """Return a mock scenario without hitting Ollama."""
    title = f"Authored: {req.brief[:40]}"
    slug = _slugify(title)
    slug = _unique_slug(slug, scenarios_dir)

    steps: list[ScenarioStep] = []
    for i in range(1, req.num_steps + 1):
        step_id = f"step-{i}"
        steps.append(
            ScenarioStep(
                id=step_id,
                order=i,
                teacher_prompt=f"Step {i}: {req.brief[:60]}",
                teacher_prompt_vi=f"Bước {i}: {req.brief[:60]}",
                scene_image_url=f"/static/images/{slug}/{step_id}.png",
                scene_image_prompt=(
                    f"Kid-friendly cartoon illustration for step {i} of {req.skill_domain} skill, "
                    "soft pastel colors, diverse characters, plain pastel background, no text"
                ),
                response_type="voice_or_choice",
                choices=[
                    Choice(id="a", text="Yes, I can!", is_correct=True),
                    Choice(id="b", text="No way!", is_correct=False),
                    Choice(id="c", text="(say nothing)", is_correct=False),
                ],
                voice_accepts=["yes", "yes i can", "i can", "sure", "okay"],
                hint_on_wrong="Try again — you can do it!",
                hint_image_url=f"/static/images/{slug}/{step_id}-hint.png",
                praise_on_correct="Excellent! You did a great job!",
                max_attempts=3,
            )
        )

    return Scenario(
        id=slug,
        title=title,
        title_vi=f"Đã tạo: {req.brief[:40]}",
        skill_domain=req.skill_domain,
        difficulty=req.difficulty,
        thumbnail_url=f"/static/images/{slug}/thumb.png",
        estimated_minutes=math.ceil(req.num_steps * 1.5),
        language=req.language,
        steps=steps,
    )


def _parse_and_validate(raw: str) -> Scenario:
    """Parse raw JSON string into a Scenario. Raises ValidationError or json.JSONDecodeError."""
    data = json.loads(raw)
    return Scenario.model_validate(data)


def _write_scenario(scenario: Scenario, scenarios_dir: Path) -> None:
    """Write scenario to disk as pretty-printed JSON."""
    out_path = scenarios_dir / f"{scenario.id}.json"
    out_path.write_text(
        json.dumps(scenario.model_dump(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    logger.info("Wrote scenario to %s", out_path)


def _ollama_call_sync(system_prompt: str, user_msg: str) -> str:
    """Blocking Ollama call. Runs inside run_in_executor."""
    import ollama  # noqa: PLC0415

    settings = get_settings()
    client = ollama.Client(host=settings.ollama_host)
    response = client.chat(
        model=settings.ollama_author_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
        ],
        format="json",
        options={"temperature": 0.6},
    )
    return response["message"]["content"]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class AuthorService:
    """Generate, validate, persist, and return a new Scenario from a brief."""

    def __init__(
        self,
        scenario_service: ScenarioService,
        image_gen_service: ImageGenService,
    ) -> None:
        self.scenario_service = scenario_service
        self.image_gen_service = image_gen_service

    async def author(self, req: AuthorRequest) -> Scenario:
        settings = get_settings()
        scenarios_dir = settings.scenarios_dir

        # ── MOCK PATH ────────────────────────────────────────────────────────
        if settings.mock_ai:
            scenario = _make_canned_scenario(req, scenarios_dir)
            _write_scenario(scenario, scenarios_dir)
            self.scenario_service.reload()
            self._kick_off_images(scenario)
            return scenario

        # ── REAL PATH (Ollama) ───────────────────────────────────────────────
        user_msg = _build_user_message(req)
        loop = asyncio.get_event_loop()

        # First attempt
        raw = await loop.run_in_executor(None, _ollama_call_sync, _AUTHOR_PROMPT, user_msg)

        try:
            scenario = _parse_and_validate(raw)
        except (ValidationError, json.JSONDecodeError, Exception) as first_err:
            logger.warning("Author first attempt failed: %s", first_err)

            # Build retry message with error context
            retry_msg = (
                f"Your previous response had these errors:\n{first_err}\n\n"
                "Fix ONLY the errors listed. Re-emit STRICT JSON only. "
                "No markdown, no prose. The JSON must match the schema exactly.\n\n"
                f"Original request: {user_msg}\n\n"
                f"Your previous (invalid) response was:\n{raw}"
            )

            raw2 = await loop.run_in_executor(None, _ollama_call_sync, _AUTHOR_PROMPT, retry_msg)

            try:
                scenario = _parse_and_validate(raw2)
            except (ValidationError, json.JSONDecodeError, Exception) as second_err:
                logger.error("Author retry also failed: %s", second_err)
                raise second_err

        # Ensure unique slug on disk
        slug = _unique_slug(scenario.id or _slugify(scenario.title), scenarios_dir)
        if slug != scenario.id:
            # Rebuild with corrected id + URLs
            scenario = scenario.model_copy(
                update={
                    "id": slug,
                    "thumbnail_url": f"/static/images/{slug}/thumb.png",
                    "steps": [
                        s.model_copy(
                            update={
                                "scene_image_url": f"/static/images/{slug}/{s.id}.png",
                                "hint_image_url": f"/static/images/{slug}/{s.id}-hint.png",
                            }
                        )
                        for s in scenario.steps
                    ],
                }
            )

        _write_scenario(scenario, scenarios_dir)
        self.scenario_service.reload()
        self._kick_off_images(scenario)
        return scenario

    def _kick_off_images(self, scenario: Scenario) -> None:
        """Fire-and-forget background image generation for all steps."""
        async def _gen_all() -> None:
            tasks = []
            for step in scenario.steps:
                if step.scene_image_prompt:
                    tasks.append(
                        self.image_gen_service.generate(
                            scenario_id=scenario.id,
                            step_id=step.id,
                            prompt=step.scene_image_prompt,
                            kind="scene",
                        )
                    )
                    tasks.append(
                        self.image_gen_service.generate(
                            scenario_id=scenario.id,
                            step_id=step.id,
                            prompt=f"Hint image for: {step.hint_on_wrong or step.scene_image_prompt}",
                            kind="hint",
                        )
                    )
            # Thumbnail
            tasks.append(
                self.image_gen_service.generate(
                    scenario_id=scenario.id,
                    step_id="thumb",
                    prompt=f"Thumbnail for scenario: {scenario.title}",
                    kind="thumbnail",
                )
            )
            await asyncio.gather(*tasks, return_exceptions=True)

        asyncio.create_task(_gen_all())
