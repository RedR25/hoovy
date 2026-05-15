from typing import Annotated

from fastapi import Depends

from app.core.dependencies import DbSession
from app.modules.sessions.repository import AttentionLogRepository, SessionRepository, TrialRepository
from app.modules.sessions.service import SessionService


def get_session_repository(session: DbSession) -> SessionRepository:
    return SessionRepository(session)


def get_trial_repository(session: DbSession) -> TrialRepository:
    return TrialRepository(session)


def get_attention_log_repository(session: DbSession) -> AttentionLogRepository:
    return AttentionLogRepository(session)


SessionRepoDep = Annotated[SessionRepository, Depends(get_session_repository)]
TrialRepoDep = Annotated[TrialRepository, Depends(get_trial_repository)]
AttentionLogRepoDep = Annotated[AttentionLogRepository, Depends(get_attention_log_repository)]


def get_session_service(
    session_repo: SessionRepoDep,
    trial_repo: TrialRepoDep,
    attention_repo: AttentionLogRepoDep,
) -> SessionService:
    return SessionService(session_repo, trial_repo, attention_repo)


SessionServiceDep = Annotated[SessionService, Depends(get_session_service)]
