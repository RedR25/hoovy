from collections.abc import Sequence
from uuid import UUID

from app.modules.kids.models import Kid
from app.modules.kids.repository import KidRepository
from app.modules.kids.schemas import KidCreate
from app.shared.base.service import BaseService
from app.shared.exceptions import NotFoundError


class KidService(BaseService):
    def __init__(self, repo: KidRepository) -> None:
        self.repo = repo

    async def create(self, parent_user_id: UUID, data: KidCreate) -> Kid:
        kid = Kid(
            parent_user_id=parent_user_id,
            display_name=data.display_name,
            avatar_emoji=data.avatar_emoji,
            dob=data.dob,
        )
        return await self.repo.add(kid)

    async def list_for_parent(self, parent_user_id: UUID) -> Sequence[Kid]:
        return await self.repo.list_for_parent(parent_user_id)

    async def get(self, kid_id: UUID) -> Kid:
        kid = await self.repo.get(kid_id)
        if not kid:
            raise NotFoundError(f"kid '{kid_id}' not found")
        return kid

    async def delete(self, kid_id: UUID) -> None:
        kid = await self.get(kid_id)
        await self.repo.delete(kid)
