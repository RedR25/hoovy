"""Pydantic schemas for the TTS module."""
from __future__ import annotations

from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize")
    voice: str | None = Field(None, description="Kokoro voice ID (e.g. af_bella)")
    speed: float | None = Field(None, ge=0.1, le=5.0, description="Speech speed multiplier")
