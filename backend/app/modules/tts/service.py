"""TTSService — Kokoro in-process TTS.

Lifecycle notes:
- KPipeline is lazily constructed on the first real synthesis call.
  The first call may take 10–20 s: Kokoro downloads ~325 MB of weights and
  loads them onto CPU. Subsequent calls are fast (warm model in RAM).
  Slice 4 will add pre-warming so the penalty doesn't hit the first student.
- When settings.mock_ai is True no model is ever loaded: the service returns a
  canned 440 Hz sine-wave WAV so tests and demos work without network/disk I/O.
- A threading.Lock makes first-call init safe under FastAPI's thread-pool
  executor (run_in_executor uses the default ThreadPoolExecutor).
"""
from __future__ import annotations

import io
import math
import struct
import threading
from typing import TYPE_CHECKING

from app.core.config import get_settings

if TYPE_CHECKING:
    pass


_SAMPLE_RATE = 24_000  # Kokoro native sample rate
_SILENCE_S = 0.3
_MOCK_DURATION_S = 0.5
_MOCK_FREQ = 440.0


def _sine_wav(freq: float, duration_s: float, sample_rate: int = _SAMPLE_RATE) -> bytes:
    """Return a 16-bit PCM mono WAV of a sine tone — no external deps."""
    n_samples = int(duration_s * sample_rate)
    samples = [
        int(32767 * math.sin(2 * math.pi * freq * i / sample_rate))
        for i in range(n_samples)
    ]
    buf = io.BytesIO()
    _write_wav(buf, samples, sample_rate)
    return buf.getvalue()


def _silence_wav(duration_s: float, sample_rate: int = _SAMPLE_RATE) -> bytes:
    n_samples = int(duration_s * sample_rate)
    buf = io.BytesIO()
    _write_wav(buf, [0] * n_samples, sample_rate)
    return buf.getvalue()


def _write_wav(buf: io.BytesIO, samples: list[int], sample_rate: int) -> None:
    """Write raw PCM samples (int16) into buf as a RIFF WAV."""
    n = len(samples)
    data_bytes = struct.pack(f"<{n}h", *samples)
    # RIFF header
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + len(data_bytes)))
    buf.write(b"WAVE")
    # fmt chunk
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))       # chunk size
    buf.write(struct.pack("<H", 1))        # PCM
    buf.write(struct.pack("<H", 1))        # mono
    buf.write(struct.pack("<I", sample_rate))
    buf.write(struct.pack("<I", sample_rate * 2))  # byte rate
    buf.write(struct.pack("<H", 2))        # block align
    buf.write(struct.pack("<H", 16))       # bits per sample
    # data chunk
    buf.write(b"data")
    buf.write(struct.pack("<I", len(data_bytes)))
    buf.write(data_bytes)


class TTSService:
    """Singleton wrapper around KPipeline (Kokoro)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._pipeline = None  # KPipeline, lazily created

    def _get_pipeline(self):
        """Return cached KPipeline, creating it on first call (thread-safe)."""
        if self._pipeline is not None:
            return self._pipeline
        with self._lock:
            if self._pipeline is None:
                from kokoro import KPipeline  # noqa: PLC0415
                settings = get_settings()
                self._pipeline = KPipeline(lang_code=settings.kokoro_lang_code)
        return self._pipeline

    def synthesize(
        self,
        text: str,
        voice: str | None = None,
        speed: float | None = None,
    ) -> bytes:
        """Return WAV bytes (16-bit PCM, 24 kHz, mono).

        Args:
            text: Text to synthesize. Empty string → short silence.
            voice: Kokoro voice ID; falls back to settings.kokoro_voice.
            speed: Speech speed; falls back to settings.kokoro_speed.

        Returns:
            WAV bytes ready to serve as audio/wav.
        """
        settings = get_settings()

        if settings.mock_ai:
            return _sine_wav(_MOCK_FREQ, _MOCK_DURATION_S)

        text = (text or "").strip()
        if not text:
            return _silence_wav(_SILENCE_S)

        _voice = voice or settings.kokoro_voice
        _speed = speed if speed is not None else settings.kokoro_speed

        pipeline = self._get_pipeline()

        # Kokoro yields (graphemes, phonemes, audio_tensor) chunks.
        import numpy as np  # noqa: PLC0415

        chunks: list = []
        for _, _, audio in pipeline(text, voice=_voice, speed=_speed):
            if audio is not None:
                # audio may be a torch tensor or numpy array
                arr = audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio)
                chunks.append(arr)

        if not chunks:
            return _silence_wav(_SILENCE_S)

        full = np.concatenate(chunks, axis=0).astype(np.float32)

        import soundfile as sf  # noqa: PLC0415

        buf = io.BytesIO()
        sf.write(buf, full, _SAMPLE_RATE, format="WAV", subtype="PCM_16")
        return buf.getvalue()
