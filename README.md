# Hoovy

Single-process monolith: FastAPI serves both the JSON API and the built React SPA. One container, one port, no CORS in prod.

```
hoovy/
├── backend/    FastAPI (modular monolith, DI via Depends)
├── frontend/   React + Vite + TypeScript (built into backend image)
├── scripts/    dev launchers
├── Dockerfile  multi-stage: builds frontend, copies into backend image
└── docker-compose.yml
```

## Development (two processes, hot reload on both)

In dev, run the backend and frontend separately so each keeps its own watcher. FastAPI's `--reload` watches Python files; Vite serves the SPA on `:5173` with HMR and proxies `/api` to the backend.

```powershell
# Windows
./scripts/dev.ps1
```
```bash
# macOS/Linux
./scripts/dev.sh
```

Or manually, two terminals:
```bash
# terminal 1
cd backend && uvicorn app.main:app --reload --port 8000

# terminal 2
cd frontend && npm run dev          # http://localhost:5173
```

In dev, `STATIC_DIR` is unset → FastAPI does **not** serve the SPA, you hit Vite on `:5173`. This is what you want: HMR for the frontend, `--reload` for the backend.

## Production (single image)

```bash
docker compose up --build
# http://localhost:8000 serves both the API and the SPA
```

The root [Dockerfile](Dockerfile) builds the React bundle in stage 1, copies `dist/` into the Python image in stage 2, and sets `STATIC_DIR=/app/frontend_dist`. FastAPI's lifespan mounts it with deep-link fallback to `index.html`.

## Architecture rules

**Backend** — feature modules under [backend/app/modules/`<name>`/](backend/app/modules/) with `router`, `service`, `repository`, `schemas`, `models`, `dependencies`. Cross-cutting in [backend/app/core/](backend/app/core/) and [backend/app/shared/](backend/app/shared/). The DI chain is wired through FastAPI `Depends`: `router → service → repository → AsyncSession`. SPA static-serving lives in [backend/app/shared/spa.py](backend/app/shared/spa.py) — main.py just calls it.

**Frontend** — feature modules under [frontend/src/features/`<name>`/](frontend/src/features/) with `api`, `hooks`, `types`, `components`, `pages`. Cross-cutting in [frontend/src/shared/](frontend/src/shared/); app-level providers in [frontend/src/providers/](frontend/src/providers/). Features depend on `shared/`, never on each other.
