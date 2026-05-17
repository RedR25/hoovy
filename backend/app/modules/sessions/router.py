from fastapi import APIRouter, status

from app.modules.sessions.dependencies import SessionServiceDep
from app.modules.sessions.schemas import (
    AttentionLogCreate,
    AttentionLogRead,
    SessionCreate,
    SessionProgress,
    SessionRead,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def create_session(payload: SessionCreate, service: SessionServiceDep) -> SessionRead:
    session = await service.create(
        scenario_id=payload.scenario_id,
        language=payload.language,
    )
    return SessionRead.model_validate(session)


@router.post("/{session_id}/end", response_model=SessionRead)
async def end_session(session_id: str, service: SessionServiceDep) -> SessionRead:
    session = await service.end(session_id)
    return SessionRead.model_validate(session)


@router.get("/{session_id}/progress", response_model=SessionProgress)
async def get_progress(session_id: str, service: SessionServiceDep) -> SessionProgress:
    return await service.progress(session_id)


@router.post(
    "/{session_id}/attention",
    response_model=AttentionLogRead,
    status_code=status.HTTP_201_CREATED,
)
async def log_attention(
    session_id: str, payload: AttentionLogCreate, service: SessionServiceDep
) -> AttentionLogRead:
    log = await service.log_attention(
        session_id=session_id,
        step_id=payload.step_id,
        on_screen_pct=payload.on_screen_pct,
        off_screen_seconds=payload.off_screen_seconds,
        redirects_triggered=payload.redirects_triggered,
    )
    return AttentionLogRead.model_validate(log)
