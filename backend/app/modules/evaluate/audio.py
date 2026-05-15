"""Audio conversion helpers.

pydub needs ffmpeg; we supply the binary bundled with imageio-ffmpeg so no
system-level install is required on Windows or CI.
"""
from __future__ import annotations

import io

import imageio_ffmpeg
import pydub

# Point pydub at the bundled ffmpeg binary before any AudioSegment usage.
pydub.AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()


def convert_to_wav_16k_mono(blob: bytes, source_format_hint: str | None = None) -> bytes:
    """Convert arbitrary audio bytes to 16 kHz mono PCM WAV.

    source_format_hint is the container name pydub uses (e.g. "webm", "ogg").
    None lets pydub sniff the format, which works for WAV/MP3 but fails for
    raw WebM from MediaRecorder — callers should pass "webm" in that case.
    """
    fmt = source_format_hint or "wav"
    segment = pydub.AudioSegment.from_file(io.BytesIO(blob), format=fmt)
    segment = segment.set_frame_rate(16_000).set_channels(1).set_sample_width(2)
    buf = io.BytesIO()
    segment.export(buf, format="wav")
    return buf.getvalue()
