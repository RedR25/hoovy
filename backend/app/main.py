import app.core.hf_bootstrap  # noqa: F401  # MUST be first — sets HF env before any model lib loads

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.database import Base, engine
import app.modules.sessions.models  # noqa: F401  # registers ORM tables with Base.metadata
from app.shared.error_handlers import register_error_handlers
from app.shared.middleware import RequestContextMiddleware
from app.shared.spa import mount_spa


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience — replace with Alembic in production.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Fire-and-forget: pre-warm Kokoro + Gemma so the first real request is fast.
    from app.modules.warmup.service import run_warmup  # noqa: PLC0415
    asyncio.create_task(run_warmup())

    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestContextMiddleware)

    register_error_handlers(app)

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    # Static images mount — BEFORE SPA catchall so it isn't shadowed.
    images_root = settings.images_dir
    images_root.mkdir(parents=True, exist_ok=True)
    app.mount("/static/images", StaticFiles(directory=images_root), name="static-images")

    # Mount LAST: the SPA catchall absorbs every remaining path.
    mount_spa(app, settings.static_dir, settings.api_v1_prefix)
    return app


app = create_app()
