from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from app.modules.kids.models import Kid
from app.shared.base.repository import BaseRepository


class KidRepository(BaseRepository[Kid]):
    model = Kid

    async def list_for_parent(self, parent_user_id: UUID) -> Sequence[Kid]:
        stmt = select(Kid).where(Kid.parent_user_id == parent_user_id).order_by(Kid.created_at)
        result = await self.session.execute(stmt)
        return result.scalars().all()
