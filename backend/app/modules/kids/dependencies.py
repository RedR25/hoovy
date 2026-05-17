from typing import Annotated

from fastapi import Depends

from app.core.dependencies import DbSession
from app.modules.kids.repository import KidRepository
from app.modules.kids.service import KidService


def get_kid_repository(session: DbSession) -> KidRepository:
    return KidRepository(session)


KidRepoDep = Annotated[KidRepository, Depends(get_kid_repository)]


def get_kid_service(repo: KidRepoDep) -> KidService:
    return KidService(repo)


KidServiceDep = Annotated[KidService, Depends(get_kid_service)]
