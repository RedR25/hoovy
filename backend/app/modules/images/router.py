"""Images router — generate and cache scenario images."""
from __future__ import annotations

import logging

from fastapi import APIRouter

from app.modules.images.dependencies import ImageGenServiceDep
from app.modules.images.schemas import ImageGenerateRequest, ImageGenerateResponse
from app.modules.scenarios.dependencies import ScenarioServiceDep

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/generate", response_model=ImageGenerateResponse)
async def generate_image(
    req: ImageGenerateRequest,
    service: ImageGenServiceDep,
) -> ImageGenerateResponse:
    """Generate (or return cached) a single image asset."""
    return await service.generate(
        scenario_id=req.scenario_id,
        step_id=req.step_id,
        prompt=req.prompt,
        kind=req.kind,
        force=req.force,
    )


@router.post("/regenerate/{scenario_id}", response_model=list[ImageGenerateResponse])
async def regenerate_scenario_images(
    scenario_id: str,
    scenario_service: ScenarioServiceDep,
    image_service: ImageGenServiceDep,
    force: bool = False,
) -> list[ImageGenerateResponse]:
    """Batch-generate all scene + hint images for a scenario plus its thumbnail.

    Useful for demo prep. Pass ?force=true to overwrite cached files.
    """
    scenario = scenario_service.get(scenario_id)
    results: list[ImageGenerateResponse] = []

    # Thumbnail
    thumb_prompt = f"{scenario.title} — {scenario.skill_domain} skill, overview thumbnail"
    results.append(
        await image_service.generate(
            scenario_id=scenario_id,
            step_id="thumb",
            prompt=thumb_prompt,
            kind="thumbnail",
            force=force,
        )
    )

    for step in scenario.steps:
        # Scene image
        scene_prompt = step.scene_image_prompt or step.teacher_prompt
        results.append(
            await image_service.generate(
                scenario_id=scenario_id,
                step_id=step.id,
                prompt=scene_prompt,
                kind="scene",
                force=force,
            )
        )

        # Hint image (only if step has one referenced)
        if step.hint_image_url:
            hint_prompt = f"Hint illustration: {step.hint_on_wrong or step.teacher_prompt}"
            results.append(
                await image_service.generate(
                    scenario_id=scenario_id,
                    step_id=step.id,
                    prompt=hint_prompt,
                    kind="hint",
                    force=force,
                )
            )

    return results
