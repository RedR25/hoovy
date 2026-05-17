"""AuthorService — generate a full Scenario JSON from a parent's brief.

Two-phase flow:
1. POST /author/draft  → AI generates, validated, returned in-memory only.
2. POST /author/publish → caller approves a draft_id; we write to disk and
   kick off image generation. Until publish, nothing is saved.
"""
from __future__ import annotations

import asyncio
import json
import logging
import math
import re
from pathlib import Path
from uuid import uuid4

from pydantic import ValidationError

from app.core.config import get_settings
from app.modules.author.schemas import AuthorRequest, complexity_to_difficulty
from app.modules.images.service import ImageGenService
from app.modules.scenarios.schemas import Choice, Scenario, ScenarioStep
from app.modules.scenarios.service import ScenarioService

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent / "prompts" / "author_scenario.txt"
_AUTHOR_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8")

# In-memory draft store. Process-local; fine for a single-process demo.
_DRAFTS: dict[str, Scenario] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _unique_slug(slug: str, scenarios_dir: Path) -> str:
    candidate = slug
    counter = 2
    while (scenarios_dir / f"{candidate}.json").exists():
        candidate = f"{slug}-{counter}"
        counter += 1
    return candidate


def _build_user_message(req: AuthorRequest) -> str:
    return (
        f'skill_target="{req.skill_target}", '
        f'child_interests="{req.child_interests}", '
        f"complexity={req.complexity}, "
        f"skill_domain={req.skill_domain}, "
        f"num_steps={req.num_steps}"
    )


def _make_canned_scenario(req: AuthorRequest, scenarios_dir: Path) -> Scenario:
    """Return a mock scenario without hitting Ollama. Used when MOCK_AI=true."""
    title = f"{req.child_interests}: {req.skill_target[:40]}"
    slug = _slugify(title) or "authored"
    slug = _unique_slug(slug, scenarios_dir)

    steps: list[ScenarioStep] = []
    for i in range(1, req.num_steps + 1):
        step_id = f"step-{i}"
        steps.append(
            ScenarioStep(
                id=step_id,
                order=i,
                teacher_prompt=f"Step {i} of '{req.skill_target}' — themed with {req.child_interests}.",
                scene_image_url=f"/static/images/{slug}/{step_id}.png",
                scene_image_prompt=(
                    f"Kid-friendly cartoon illustration for step {i} of {req.skill_domain} skill, "
                    f"themed around {req.child_interests}, soft pastel colors, no text"
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
        skill_domain=req.skill_domain,
        difficulty=complexity_to_difficulty(req.complexity),
        thumbnail_url=f"/static/images/{slug}/thumb.png",
        estimated_minutes=math.ceil(req.num_steps * 1.5),
        language="en",
        child_interests=req.child_interests,
        steps=steps,
    )


def _parse_and_validate(raw: str) -> Scenario:
    data = json.loads(raw)
    return Scenario.model_validate(data)


def _write_scenario(scenario: Scenario, scenarios_dir: Path) -> None:
    out_path = scenarios_dir / f"{scenario.id}.json"
    out_path.write_text(
        json.dumps(scenario.model_dump(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    logger.info("Wrote scenario to %s", out_path)


def _ollama_call_sync(system_prompt: str, user_msg: str) -> str:
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
    """Two-phase: generate a draft, then publish."""

    def __init__(
        self,
        scenario_service: ScenarioService,
        image_gen_service: ImageGenService,
    ) -> None:
        self.scenario_service = scenario_service
        self.image_gen_service = image_gen_service

    async def draft(self, req: AuthorRequest) -> tuple[str, Scenario]:
        """Generate a scenario in-memory. Returns (draft_id, scenario).

        No disk write, no image generation. Kid-safe to throw away.
        """
        settings = get_settings()
        scenarios_dir = settings.scenarios_dir

        if settings.mock_ai:
            scenario = _make_canned_scenario(req, scenarios_dir)
        else:
            scenario = await self._generate_with_ollama(req, scenarios_dir)

        draft_id = uuid4().hex
        _DRAFTS[draft_id] = scenario
        return draft_id, scenario

    async def publish(self, draft_id: str) -> Scenario:
        """Persist a previously-generated draft to disk and queue images."""
        scenario = _DRAFTS.pop(draft_id, None)
        if scenario is None:
            raise ValueError(f"draft '{draft_id}' not found or already published")

        settings = get_settings()
        scenarios_dir = settings.scenarios_dir

        # Re-resolve slug in case the same draft id collides with newly published files
        slug = _unique_slug(scenario.id, scenarios_dir)
        if slug != scenario.id:
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

    async def _generate_with_ollama(
        self, req: AuthorRequest, scenarios_dir: Path
    ) -> Scenario:
        user_msg = _build_user_message(req)
        loop = asyncio.get_event_loop()

        raw = await loop.run_in_executor(None, _ollama_call_sync, _AUTHOR_PROMPT, user_msg)
        try:
            scenario = _parse_and_validate(raw)
        except (ValidationError, json.JSONDecodeError, Exception) as first_err:
            logger.warning("Author first attempt failed: %s", first_err)
            retry_msg = (
                f"Your previous response had these errors:\n{first_err}\n\n"
                "Fix ONLY the errors listed. Re-emit STRICT JSON only.\n\n"
                f"Original request: {user_msg}\n\n"
                f"Your previous (invalid) response was:\n{raw}"
            )
            raw2 = await loop.run_in_executor(None, _ollama_call_sync, _AUTHOR_PROMPT, retry_msg)
            scenario = _parse_and_validate(raw2)

        # Force the requested child_interests/skill_domain onto the response
        # so the model can't silently drop them.
        scenario = scenario.model_copy(
            update={
                "child_interests": req.child_interests,
                "skill_domain": req.skill_domain,
                "difficulty": complexity_to_difficulty(req.complexity),
            }
        )

        # Pre-emptively unique-slug so two parallel drafts don't collide on publish.
        slug = _unique_slug(scenario.id or _slugify(scenario.title), scenarios_dir)
        if slug != scenario.id:
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
        return scenario

    def _kick_off_images(self, scenario: Scenario) -> None:
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
