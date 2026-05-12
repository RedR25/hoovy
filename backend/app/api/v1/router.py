"""API v1 router aggregator.

To expose a new module, import its routers and include them here.
"""
from fastapi import APIRouter

from app.modules.users import auth_router as users_auth_router
from app.modules.users import router as users_router

api_v1_router = APIRouter()
api_v1_router.include_router(users_router)
api_v1_router.include_router(users_auth_router)
