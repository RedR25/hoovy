"""Audio conversion + silence detection.

pydub needs ffmpeg; we supply the binary bundled with imageio-ffmpeg so no
system-level install is required on Windows or CI.
"""
from __future__ import annotations

import io

import imageio_ffmpeg
import pydub

pydub.AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()


# dBFS threshold below which we treat the clip as "silent / no speech".
# Quiet room ambient is typically -55 to -45 dBFS; normal speech is -25 to -10.
SILENCE_DBFS_THRESHOLD = -45.0


def convert_to_wav_16k_mono(blob: bytes, source_format_hint: str | None = None) -> bytes:
    """Convert arbitrary audio bytes to 16 kHz mono PCM WAV."""
    fmt = source_format_hint or "wav"
    segment = pydub.AudioSegment.from_file(io.BytesIO(blob), format=fmt)
    segment = segment.set_frame_rate(16_000).set_channels(1).set_sample_width(2)
    buf = io.BytesIO()
    segment.export(buf, format="wav")
    return buf.getvalue()


def is_silent(blob: bytes, source_format_hint: str | None = None) -> bool:
    """Return True if the clip's overall loudness is below the silence threshold.

    Avoids the LLM-hallucinates-on-silence failure mode: an empty / near-empty
    clip should never reach Gemma, which would fabricate a positive answer
    under format='json'.
    """
    fmt = source_format_hint or "wav"
    try:
        segment = pydub.AudioSegment.from_file(io.BytesIO(blob), format=fmt)
    except Exception:
        return False  # if we can't decode, let the caller fail downstream
    dbfs = segment.dBFS
    if dbfs == float("-inf"):
        return True
    return dbfs < SILENCE_DBFS_THRESHOLD
