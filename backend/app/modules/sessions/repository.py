from collections.abc import Sequence

from sqlalchemy import select

from app.modules.sessions.models import AttentionLog, Session, Trial
from app.shared.base.repository import BaseRepository


class SessionRepository(BaseRepository[Session]):
    model = Session


class TrialRepository(BaseRepository[Trial]):
    model = Trial

    async def list_for_session(self, session_id: str) -> Sequence[Trial]:
        stmt = select(Trial).where(Trial.session_id == session_id).order_by(Trial.id)
        result = await self.session.execute(stmt)
        return result.scalars().all()


class AttentionLogRepository(BaseRepository[AttentionLog]):
    model = AttentionLog

    async def list_for_session(self, session_id: str) -> Sequence[AttentionLog]:
        stmt = (
            select(AttentionLog)
            .where(AttentionLog.session_id == session_id)
            .order_by(AttentionLog.id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
