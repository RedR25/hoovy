"""Author router — POST /author/scenario."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.modules.author.dependencies import AuthorServiceDep
from app.modules.author.schemas import AuthorRequest
from app.modules.scenarios.schemas import Scenario

router = APIRouter(prefix="/author", tags=["author"])


@router.post("/scenario", response_model=Scenario)
async def author_scenario(
    req: AuthorRequest,
    svc: AuthorServiceDep,
) -> Scenario:
    """Generate a new scenario from a one-line brief.

    Returns 200 with the generated Scenario JSON.
    Returns 422 if the AI produces invalid JSON after one retry.
    May take up to 60–180 s with a real Ollama model — show a spinner.
    """
    try:
        scenario = await svc.author(req)
    except (ValidationError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail=(
                f"AI produced invalid scenario JSON after one retry. "
                f"Error: {exc}. "
                "Try again or use a stronger model (set OLLAMA_AUTHOR_MODEL env var)."
            ),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Authoring failed: {exc}",
        ) from exc

    return scenario
