"""DI wiring for the scenarios module."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.modules.scenarios.service import ScenarioService

# Module-level singleton — no DB session required.
_service = ScenarioService()


def get_scenario_service() -> ScenarioService:
    return _service


ScenarioServiceDep = Annotated[ScenarioService, Depends(get_scenario_service)]
