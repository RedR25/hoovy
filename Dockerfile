# Hoovy single-image monolith.
#
# Stage 1 builds the React bundle. Stage 2 ships the FastAPI app + Kokoro
# in-process TTS + the bundled SPA. One container, one port, no reverse proxy.
# Ollama lives in a sibling container (see docker-compose.yml).

# ----- Stage 1: build the SPA -----
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# ----- Stage 2: Python runtime -----
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    STATIC_DIR=/app/frontend_dist \
    OLLAMA_HOST=http://ollama:11434

# libsndfile1 — soundfile bindings; ffmpeg — pydub fallback if the bundled
# imageio-ffmpeg binary doesn't ship for the slim base arch.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libsndfile1 ffmpeg curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/pyproject.toml ./
RUN pip install --upgrade pip && pip install -e .

COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./

COPY --from=frontend-build /frontend/dist ./frontend_dist

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
