"""Author router — draft + publish endpoints."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.modules.author.dependencies import AuthorServiceDep
from app.modules.author.schemas import AuthorRequest, DraftResponse, PublishRequest
from app.modules.scenarios.schemas import Scenario

router = APIRouter(prefix="/author", tags=["author"])


@router.post("/draft", response_model=DraftResponse)
async def draft_scenario(
    req: AuthorRequest,
    svc: AuthorServiceDep,
) -> DraftResponse:
    """Generate a scenario draft — in-memory, not persisted yet.

    May take up to 60–180 s with a real Ollama model. Show a spinner.
    """
    try:
        draft_id, scenario = await svc.draft(req)
    except (ValidationError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail=(
                f"AI produced invalid scenario JSON after one retry. "
                f"Error: {exc}. Try again or simplify your inputs."
            ),
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Draft failed: {exc}") from exc

    return DraftResponse(draft_id=draft_id, scenario=scenario)


@router.post("/publish", response_model=Scenario)
async def publish_scenario(
    req: PublishRequest,
    svc: AuthorServiceDep,
) -> Scenario:
    """Persist a previously drafted scenario to disk and queue image gen."""
    try:
        return await svc.publish(req.draft_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Publish failed: {exc}") from exc


# ── Back-compat: existing /scenario endpoint = draft + immediate publish ──
@router.post("/scenario", response_model=Scenario)
async def author_scenario_legacy(
    req: AuthorRequest,
    svc: AuthorServiceDep,
) -> Scenario:
    """Legacy one-shot endpoint — drafts then publishes immediately.

    Prefer /draft + /publish for the parent UX so they can preview first.
    """
    try:
        draft_id, _ = await svc.draft(req)
        return await svc.publish(draft_id)
    except (ValidationError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
