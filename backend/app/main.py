from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.database import Base, engine
from app.shared.error_handlers import register_error_handlers
from app.shared.middleware import RequestContextMiddleware
from app.shared.spa import mount_spa


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience — replace with Alembic in production.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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

    # Mount LAST: the SPA catchall absorbs every remaining path.
    mount_spa(app, settings.static_dir, settings.api_v1_prefix)
    return app


app = create_app()
