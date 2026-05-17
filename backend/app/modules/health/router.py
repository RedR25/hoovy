"""Health checks: app + downstream services (Ollama).

The root `/health` returns app status only; this module adds dependency probes
under `/api/v1/health/*` so we can verify the stack from one curl.
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_summary() -> dict:
    """Roll-up health: app + Ollama + mock_ai flag. Returns 200 even on
    downstream errors so the frontend can show a friendly degraded-mode banner
    instead of treating the entire app as down.
    """
    settings = get_settings()
    ollama_status = await _probe_ollama(settings.ollama_host)
    return {
        "status": "ok",
        "ollama": ollama_status,
        "mock_ai": settings.mock_ai,
    }


@router.get("/ollama")
async def health_ollama() -> dict[str, str]:
    settings = get_settings()
    return {"ollama": await _probe_ollama(settings.ollama_host)}


async def _probe_ollama(base_url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{base_url.rstrip('/')}/api/tags")
            return "ok" if r.status_code == 200 else f"error:{r.status_code}"
    except Exception as exc:  # network down, refused, timeout
        return f"unreachable:{type(exc).__name__}"
