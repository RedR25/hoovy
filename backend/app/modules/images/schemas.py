"""Pydantic schemas for the images module."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ImageGenerateRequest(BaseModel):
    scenario_id: str
    step_id: str
    prompt: str
    kind: Literal["scene", "hint", "thumbnail"] = "scene"
    force: bool = False


class ImageGenerateResponse(BaseModel):
    url: str
    cached: bool
