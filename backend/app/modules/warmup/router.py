"""Warmup router — trigger + report warmup status."""
from fastapi import APIRouter

from app.modules.warmup.service import get_warmup_status, trigger_warmup_if_needed

router = APIRouter(prefix="/warmup", tags=["warmup"])


@router.post("")
async def kick_warmup() -> dict[str, str]:
    """Fire warmup if not already done. Idempotent.

    Frontend calls this when a scenario card is clicked so by the time
    the kid records, Gemma's audio encoder is already paged into RAM.
    """
    return trigger_warmup_if_needed()


@router.get("")
async def warmup_status() -> dict[str, str]:
    return get_warmup_status()
