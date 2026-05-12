# Single-image monolith: build the React bundle, then ship it inside the
# FastAPI image. One container, one port, no CORS, no reverse proxy.

# ----- Stage 1: build the SPA -----
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
# Build expects VITE_API_BASE_URL — same-origin in prod.
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# ----- Stage 2: Python runtime -----
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    STATIC_DIR=/app/frontend_dist

WORKDIR /app

COPY backend/pyproject.toml ./
RUN pip install --upgrade pip && pip install -e .

COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./

COPY --from=frontend-build /frontend/dist ./frontend_dist

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
