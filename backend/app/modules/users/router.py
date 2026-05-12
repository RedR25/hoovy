from fastapi import APIRouter, status

from app.modules.users.dependencies import CurrentUser, UserServiceDep
from app.modules.users.schemas import LoginRequest, TokenResponse, UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])
auth_router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, service: UserServiceDep) -> UserRead:
    user = await service.register(payload)
    return UserRead.model_validate(user)


@router.get("/me", response_model=UserRead)
async def read_me(current: CurrentUser) -> UserRead:
    return UserRead.model_validate(current)


@auth_router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, service: UserServiceDep) -> TokenResponse:
    token = await service.authenticate(payload.email, payload.password)
    return TokenResponse(access_token=token)
