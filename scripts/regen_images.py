#!/usr/bin/env python
"""regen_images.py — Pre-generate Hoovy scenario images.

Usage (run from repo root with backend venv active):
    python scripts/regen_images.py greet-teacher
    python scripts/regen_images.py --all
    python scripts/regen_images.py greet-teacher --force

Without GEMINI_API_KEY the script produces Pillow placeholder PNGs — useful
for smoke-testing the pipeline without incurring API calls.

Environment:
    GEMINI_API_KEY   — Google AI Studio key. Optional; placeholders if absent.
    MOCK_AI          — Set to 'true' to force placeholders even if key is set.
"""
from __future__ import annotations

import argparse
import asyncio
import io
import json
import os
import sys
from pathlib import Path

# Force UTF-8 stdout on Windows so Unicode status chars don't crash
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() not in ("utf-8", "utf8"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Bootstrap: add backend to sys.path so we can import app.* directly
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

SCENARIOS_DIR = REPO_ROOT / "scenarios"

# ---------------------------------------------------------------------------
# Coloured output helpers (ANSI, gracefully degrades on Windows without ANSI)
# ---------------------------------------------------------------------------
_ANSI = sys.stdout.isatty()


def _c(code: str, text: str) -> str:
    if not _ANSI:
        return text
    return f"\033[{code}m{text}\033[0m"


def ok(msg: str) -> None:
    print(f"  {_c('32', '✓')} {msg}")


def gen(msg: str) -> None:
    print(f"  {_c('36', '⟳')} {msg}")


def err(msg: str) -> None:
    print(f"  {_c('31', '✗')} {msg}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Load scenario JSON directly (no FastAPI / DB needed)
# ---------------------------------------------------------------------------

def load_scenario(scenario_id: str) -> dict:
    path = SCENARIOS_DIR / f"{scenario_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Scenario file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def list_scenario_ids() -> list[str]:
    return [p.stem for p in sorted(SCENARIOS_DIR.glob("*.json"))]


# ---------------------------------------------------------------------------
# Core generation logic — imports the ImageGenService directly
# ---------------------------------------------------------------------------

async def regen_scenario(scenario_id: str, force: bool) -> int:
    """Generate all images for one scenario. Returns number of failures."""
    from app.core.config import get_settings  # noqa: PLC0415
    from app.modules.images.service import ImageGenService  # noqa: PLC0415

    settings = get_settings()
    service = ImageGenService()

    try:
        scenario = load_scenario(scenario_id)
    except FileNotFoundError as exc:
        err(str(exc))
        return 1

    failures = 0
    print(f"\n{_c('1', scenario.get('title', scenario_id))} ({scenario_id})")

    # Thumbnail
    thumb_prompt = f"{scenario.get('title', scenario_id)} — {scenario.get('skill_domain', '')} skill, overview thumbnail"
    try:
        result = await service.generate(
            scenario_id=scenario_id,
            step_id="thumb",
            prompt=thumb_prompt,
            kind="thumbnail",
            force=force,
        )
        if result.cached:
            ok(f"thumb.png (cached)")
        else:
            gen(f"thumb.png (generated)")
    except Exception as exc:
        err(f"thumb: {exc}")
        failures += 1

    for step in scenario.get("steps", []):
        step_id = step["id"]

        # Scene
        scene_prompt = step.get("scene_image_prompt") or step.get("teacher_prompt", "")
        try:
            result = await service.generate(
                scenario_id=scenario_id,
                step_id=step_id,
                prompt=scene_prompt,
                kind="scene",
                force=force,
            )
            label = f"{step_id}.png"
            ok(f"{label} (cached)") if result.cached else gen(f"{label} (generated)")
        except Exception as exc:
            err(f"{step_id} scene: {exc}")
            failures += 1

        # Hint (only if referenced)
        if step.get("hint_image_url"):
            hint_prompt = f"Hint illustration: {step.get('hint_on_wrong') or step.get('teacher_prompt', '')}"
            try:
                result = await service.generate(
                    scenario_id=scenario_id,
                    step_id=step_id,
                    prompt=hint_prompt,
                    kind="hint",
                    force=force,
                )
                label = f"{step_id}-hint.png"
                ok(f"{label} (cached)") if result.cached else gen(f"{label} (generated)")
            except Exception as exc:
                err(f"{step_id} hint: {exc}")
                failures += 1

    return failures


async def main_async(args: argparse.Namespace) -> int:
    if args.all:
        ids = list_scenario_ids()
        if not ids:
            print("No scenario JSON files found in scenarios/")
            return 1
        print(f"Regenerating images for {len(ids)} scenario(s): {', '.join(ids)}")
    else:
        ids = [args.scenario_id]

    total_failures = 0
    for sid in ids:
        total_failures += await regen_scenario(sid, force=args.force)

    print()
    if total_failures == 0:
        print(_c("32", f"All done. 0 failures."))
    else:
        print(_c("31", f"Done with {total_failures} failure(s)."))

    return 0 if total_failures == 0 else 1


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pre-generate Hoovy scenario images (Gemini or Pillow placeholder).",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("scenario_id", nargs="?", help="Scenario ID (e.g. greet-teacher)")
    group.add_argument("--all", action="store_true", help="Regenerate all scenarios")
    parser.add_argument("--force", action="store_true", help="Overwrite cached images")
    args = parser.parse_args()

    # Clear settings cache so env vars are picked up fresh
    from app.core.config import get_settings
    get_settings.cache_clear()

    exit_code = asyncio.run(main_async(args))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
