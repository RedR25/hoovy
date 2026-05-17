from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.modules.kids.dependencies import KidServiceDep
from app.modules.kids.schemas import KidCreate, KidRead
from app.modules.users.dependencies import CurrentUser

router = APIRouter(prefix="/kids", tags=["kids"])


@router.get("", response_model=list[KidRead])
async def list_my_kids(current: CurrentUser, service: KidServiceDep) -> list[KidRead]:
    kids = await service.list_for_parent(current.id)
    return [KidRead.model_validate(k) for k in kids]


@router.post("", response_model=KidRead, status_code=status.HTTP_201_CREATED)
async def create_kid(
    payload: KidCreate, current: CurrentUser, service: KidServiceDep
) -> KidRead:
    kid = await service.create(current.id, payload)
    return KidRead.model_validate(kid)


@router.delete("/{kid_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_kid(
    kid_id: UUID, current: CurrentUser, service: KidServiceDep
) -> None:
    kid = await service.get(kid_id)
    if kid.parent_user_id != current.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your kid")
    await service.delete(kid_id)
