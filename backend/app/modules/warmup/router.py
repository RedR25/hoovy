"""Warmup router — exposes current warmup status via GET/POST."""
from fastapi import APIRouter

from app.modules.warmup.service import get_warmup_status

router = APIRouter(prefix="/warmup", tags=["warmup"])


@router.post("")
async def trigger_warmup_status() -> dict[str, str]:
    """Return current warmup status for Kokoro and Ollama.

    The actual warmup runs as a background task on startup; this endpoint
    just reports whatever state it reached. Useful for smoke-testing the demo.
    """
    return get_warmup_status()


@router.get("")
async def warmup_status() -> dict[str, str]:
    return get_warmup_status()
