# Hoovy 🦦

**A warm little learning buddy for kids on the autism spectrum — and the families who love them.**

Getting structured therapy for an autistic child is hard. Waitlists stretch for months. Sessions cost $80–$120 an hour. And even when a family finally finds a spot, the real learning often has to happen at home — between visits, on the couch, in the moments when a kid is ready to try.

Hoovy is the kitchen-table version of that learning loop. It's gentle, patient, and always available.

### How a session feels

Your child taps an episode and our cheerful otter, Hoovy, waves hello. A calm teacher voice asks a friendly question — *"You need help reaching the crayons. What could you say?"* — and your child answers out loud. Hoovy listens, then either cheers them on (*"Great asking! That was very polite."*) or quietly offers a picture hint and invites them to try again. If their attention drifts, Hoovy waits without buzzers or timers, and gently re-engages when they're ready — the way a thoughtful therapist would.

Every try is logged so parents and therapists can see what's clicking and where to slow down. Nothing is pass/fail. It's a learning *loop*, not a test.

### What makes it different

- **It runs on your device.** Speech understanding happens locally with **Gemma 4 E2B** through Ollama, and the friendly voice is synthesized in-process by **Kokoro**. Your child's audio never leaves your computer. No cloud bills, no microphone uploads, no privacy questions to wonder about late at night.
- **You can author your own lessons.** Tell Hoovy in one sentence — *"teach my kid to ask for water, themed around dinosaurs"* — and a Gemma authoring pass drafts a full scenario in under a minute, complete with prompts, accepted answers, gentle hints, and matching illustrations rendered by Gemini and cached forever.
- **It meets your kid where they already love to be.** Add interests like trains, dinosaurs, or princesses and the scenes adapt around them.
- **It's clinical methodology, not a chatbot in a friendly skin.** Hoovy uses the same trial-and-praise loop that licensed ABA therapists use — just warm, patient, and finally within reach for every family.

---

### For developers

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
