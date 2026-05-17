"""API v1 router aggregator.

To expose a new module, import its routers and include them here.
"""
from fastapi import APIRouter

from app.modules.author import router as author_router
from app.modules.evaluate import router as evaluate_router
from app.modules.health import router as health_router
from app.modules.images import router as images_router
from app.modules.scenarios import router as scenarios_router
from app.modules.sessions import router as sessions_router
from app.modules.tts import router as tts_router
from app.modules.warmup import router as warmup_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(scenarios_router)
api_v1_router.include_router(sessions_router)
api_v1_router.include_router(evaluate_router)
api_v1_router.include_router(tts_router)
api_v1_router.include_router(images_router)
api_v1_router.include_router(warmup_router)
api_v1_router.include_router(author_router)
