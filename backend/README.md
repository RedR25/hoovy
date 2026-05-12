# hoovy-backend

FastAPI modular monolith. Each feature is a self-contained module under `app/modules/<name>/` with its own router, schemas, models, repository, service, and DI wiring.

## Layering

```
router      → thin HTTP layer; translates exceptions to status codes
service     → business logic; raises domain exceptions
repository  → data access; only place SQLAlchemy is imported outside core
models      → SQLAlchemy ORM models
schemas     → Pydantic request/response models
dependencies→ FastAPI providers wiring the chain
```

Rule of thumb: **services depend on repositories, never on sessions**. **Routers depend on services, never on repositories**. Both are wired through `Depends`.

## Adding a new module

1. `mkdir app/modules/<name>` and add `__init__.py`, `models.py`, `schemas.py`, `repository.py`, `service.py`, `dependencies.py`, `router.py`.
2. Import the new model in `alembic/env.py` (so metadata picks it up) and in `app/main.py` lifespan if needed.
3. Register the router in `app/api/v1/router.py`.

## Testing

```bash
pytest
```

Tests override `get_db_session` via `app.dependency_overrides` — that's the payoff for keeping every concrete resource behind a `Depends` provider.

## Migrations

```bash
alembic revision --autogenerate -m "msg"
alembic upgrade head
```

## Serving the SPA

In prod the backend serves the built React bundle. Set `STATIC_DIR` to the absolute path of `frontend/dist` (the Docker image does this for you) and FastAPI will mount it with a deep-link fallback to `index.html`. The static-mount rule lives in `app/shared/spa.py`; main.py just calls `mount_spa(...)` after the API router is registered.

Leave `STATIC_DIR` unset in dev — you run Vite on :5173 with HMR.
