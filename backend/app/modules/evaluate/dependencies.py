from typing import Annotated

from fastapi import Depends

from app.modules.evaluate.service import EvaluateService
from app.modules.scenarios.dependencies import ScenarioServiceDep
from app.modules.sessions.dependencies import SessionServiceDep
from app.modules.tts.dependencies import TTSServiceDep


def get_evaluate_service(
    scenario_service: ScenarioServiceDep,
    session_service: SessionServiceDep,
    tts_service: TTSServiceDep,
) -> EvaluateService:
    return EvaluateService(scenario_service, session_service, tts_service)


EvaluateServiceDep = Annotated[EvaluateService, Depends(get_evaluate_service)]
