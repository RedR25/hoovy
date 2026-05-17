from uuid import UUID

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate
from app.shared.base.service import BaseService
from app.shared.exceptions import ConflictError, NotFoundError, UnauthorizedError


class UserService(BaseService):
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    async def register(self, data: UserCreate) -> User:
        if await self.repo.get_by_email(data.email):
            raise ConflictError("email already registered")
        user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            role=data.role or "parent",
        )
        return await self.repo.add(user)

    async def authenticate(self, email: str, password: str) -> str:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("invalid credentials")
        if not user.is_active:
            raise UnauthorizedError("user disabled")
        return create_access_token(subject=str(user.id))

    async def get_by_id(self, user_id: UUID) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("user not found")
        return user
