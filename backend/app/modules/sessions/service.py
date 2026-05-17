from datetime import datetime, timezone

from app.modules.sessions.models import AttentionLog, Session, Trial
from app.modules.sessions.repository import AttentionLogRepository, SessionRepository, TrialRepository
from app.modules.sessions.schemas import SessionProgress
from app.shared.base.service import BaseService
from app.shared.exceptions import NotFoundError


class SessionService(BaseService):
    def __init__(
        self,
        session_repo: SessionRepository,
        trial_repo: TrialRepository,
        attention_repo: AttentionLogRepository,
    ) -> None:
        self.session_repo = session_repo
        self.trial_repo = trial_repo
        self.attention_repo = attention_repo

    async def create(
        self,
        scenario_id: str,
        language: str,
    ) -> Session:
        session = Session(
            scenario_id=scenario_id,
            language=language,
        )
        return await self.session_repo.add(session)

    async def get(self, session_id: str) -> Session:
        session = await self.session_repo.get(session_id)
        if not session:
            raise NotFoundError(f"session '{session_id}' not found")
        return session

    async def log_trial(
        self,
        session_id: str,
        step_id: str,
        attempt_number: int,
        response_value: str,
        response_type: str,
        is_correct: bool,
        was_prompted: bool,
        latency_ms: int,
    ) -> Trial:
        await self.get(session_id)
        trial = Trial(
            session_id=session_id,
            step_id=step_id,
            attempt_number=attempt_number,
            response_value=response_value,
            response_type=response_type,
            is_correct=is_correct,
            was_prompted=was_prompted,
            latency_ms=latency_ms,
        )
        return await self.trial_repo.add(trial)

    async def end(self, session_id: str) -> Session:
        session = await self.get(session_id)
        session.ended_at = datetime.now(tz=timezone.utc)
        await self.session_repo.session.flush()
        await self.session_repo.session.refresh(session)
        return session

    async def log_attention(
        self,
        session_id: str,
        step_id: str,
        on_screen_pct: float,
        off_screen_seconds: int,
        redirects_triggered: int,
    ) -> AttentionLog:
        await self.get(session_id)
        log = AttentionLog(
            session_id=session_id,
            step_id=step_id,
            on_screen_pct=on_screen_pct,
            off_screen_seconds=off_screen_seconds,
            redirects_triggered=redirects_triggered,
        )
        return await self.attention_repo.add(log)

    async def progress(self, session_id: str) -> SessionProgress:
        await self.get(session_id)
        trials = await self.trial_repo.list_for_session(session_id)
        total = len(trials)
        correct = sum(1 for t in trials if t.is_correct)
        prompted = sum(1 for t in trials if t.was_prompted)
        accuracy = correct / total if total else 0.0
        prompt_fade_rate = 1.0 - (prompted / total) if total else 1.0
        return SessionProgress(
            session_id=session_id,
            total=total,
            correct=correct,
            accuracy=accuracy,
            prompt_fade_rate=prompt_fade_rate,
        )
