"""Module DI wiring.

Each layer is a `Depends(...)` provider. FastAPI resolves the graph:
  router → UserService → UserRepository → AsyncSession
This is the dependency injection seam — swap any provider in tests.
"""
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status

from app.core.dependencies import CurrentSubject, DbSession
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService


def get_user_repository(session: DbSession) -> UserRepository:
    return UserRepository(session)


UserRepoDep = Annotated[UserRepository, Depends(get_user_repository)]


def get_user_service(repo: UserRepoDep) -> UserService:
    return UserService(repo)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


async def get_current_user(
    subject: CurrentSubject,
    service: UserServiceDep,
) -> User:
    try:
        return await service.get_by_id(UUID(subject))
    except (ValueError, LookupError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid principal") from exc


CurrentUser = Annotated[User, Depends(get_current_user)]
