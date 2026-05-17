"""Scenarios REST endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.modules.scenarios.dependencies import ScenarioServiceDep
from app.modules.scenarios.schemas import Scenario, ScenarioSummary
from app.shared.exceptions import NotFoundError

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("", response_model=list[ScenarioSummary])
async def list_scenarios(service: ScenarioServiceDep) -> list[ScenarioSummary]:
    return service.list_all()


@router.get("/{scenario_id}", response_model=Scenario)
async def get_scenario(scenario_id: str, service: ScenarioServiceDep) -> Scenario:
    try:
        return service.get(scenario_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
