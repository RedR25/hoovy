"""TTS REST endpoint — POST /tts returns WAV audio."""
from __future__ import annotations

import asyncio

from fastapi import APIRouter
from fastapi.responses import Response

from app.modules.tts.dependencies import TTSServiceDep
from app.modules.tts.schemas import TTSRequest

router = APIRouter(prefix="/tts", tags=["tts"])


@router.post("")
async def synthesize_speech(
    body: TTSRequest,
    service: TTSServiceDep,
) -> Response:
    """Synthesize text to WAV audio via Kokoro TTS.

    The synthesis is CPU-bound, so it runs in the default thread-pool executor
    to avoid blocking the asyncio event loop.

    Returns:
        WAV audio bytes (16-bit PCM, 24 kHz, mono).
    """
    loop = asyncio.get_running_loop()
    wav_bytes: bytes = await loop.run_in_executor(
        None,
        lambda: service.synthesize(body.text, body.voice, body.speed),
    )
    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={"Content-Disposition": "inline"},
    )
