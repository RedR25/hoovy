"""DI wiring for the TTS module."""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.modules.tts.service import TTSService


@lru_cache(maxsize=1)
def get_tts_service() -> TTSService:
    return TTSService()


TTSServiceDep = Annotated[TTSService, Depends(get_tts_service)]
