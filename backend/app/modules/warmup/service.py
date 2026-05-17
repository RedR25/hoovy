"""WarmupService — pre-warms Kokoro and Gemma/Ollama on startup.

Runs as a fire-and-forget background task after tables are created.
The app accepts requests immediately; the first real request may be
slightly slower if warmup is still in progress.

Both warm-ups are skipped when settings.mock_ai is True.
"""
from __future__ import annotations

import asyncio
import io
import logging
import struct
import tempfile
import wave
from pathlib import Path

log = logging.getLogger(__name__)

# Module-level status so /api/v1/warmup can report results.
_status: dict[str, str] = {"kokoro": "pending", "ollama": "pending"}
_lock = asyncio.Lock()
_inflight: asyncio.Task | None = None


def get_warmup_status() -> dict[str, str]:
    return dict(_status)


def trigger_warmup_if_needed() -> dict[str, str]:
    """Fire warmup as a background task if it hasn't completed yet.

    Idempotent — returns immediately. Multiple concurrent callers share one
    task. Once kokoro+ollama are both 'ok', further calls are no-ops.
    """
    global _inflight  # noqa: PLW0603

    done = _status["kokoro"] == "ok" and _status["ollama"] == "ok"
    if done:
        return dict(_status)
    if _inflight is not None and not _inflight.done():
        return dict(_status)

    try:
        loop = asyncio.get_running_loop()
        _inflight = loop.create_task(run_warmup())
    except RuntimeError:
        # No running loop — caller is sync; nothing we can do here.
        pass
    return dict(_status)


async def run_warmup() -> None:
    """Entry point — call from lifespan as asyncio.create_task(run_warmup())."""
    from app.core.config import get_settings

    settings = get_settings()

    if settings.mock_ai:
        _status["kokoro"] = "skipped"
        _status["ollama"] = "skipped"
        log.info("warmup: mock_ai=True, skipping Kokoro and Ollama pre-warm")
        return

    log.info("warmup: starting background pre-warm of Kokoro and Ollama")

    loop = asyncio.get_event_loop()

    # --- Kokoro ---
    try:
        from app.modules.tts.dependencies import get_tts_service  # noqa: PLC0415

        tts = get_tts_service()
        await loop.run_in_executor(None, lambda: tts.synthesize("hi"))
        _status["kokoro"] = "ok"
        log.info("warmup: Kokoro pre-warm complete")
    except Exception as exc:
        msg = f"error:{type(exc).__name__}:{exc}"
        _status["kokoro"] = msg[:120]
        log.warning("warmup: Kokoro pre-warm failed — %s", exc)

    # --- Ollama/Gemma — text-only ping to load weights into RAM. ---
    # Audio + Kokoro + Gemma multimodal in parallel was OOMing the model
    # runner; text-only loads the same weights minus the projector.
    try:
        def _ollama_warmup() -> None:
            import ollama  # noqa: PLC0415

            client = ollama.Client(host=settings.ollama_host)
            client.chat(
                model=settings.ollama_model,
                messages=[{"role": "user", "content": "Reply with: ready"}],
                options={"temperature": 0.0, "num_predict": 4},
            )

        await loop.run_in_executor(None, _ollama_warmup)
        _status["ollama"] = "ok"
        log.info("warmup: Ollama/Gemma pre-warm complete")
    except Exception as exc:
        msg = f"error:{type(exc).__name__}:{exc}"
        _status["ollama"] = msg[:120]
        log.warning("warmup: Ollama pre-warm failed — %s", exc)


def _make_silent_wav(duration_s: float = 0.5, sample_rate: int = 16_000) -> bytes:
    """Generate an in-memory silent WAV (16-bit PCM mono)."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        n_frames = int(duration_s * sample_rate)
        w.writeframes(b"\x00" * n_frames * 2)
    return buf.getvalue()
