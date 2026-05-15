"""Pydantic schemas for the author module."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.modules.scenarios.schemas import SkillDomain


class AuthorRequest(BaseModel):
    skill_domain: SkillDomain
    brief: str = Field(..., min_length=3, max_length=500)
    difficulty: int = Field(..., ge=1, le=3)
    num_steps: int = Field(..., ge=1, le=5)
    language: Literal["en", "vi"] = "en"


class AuthorProgressEvent(BaseModel):
    phase: Literal["generating_scenario", "validating", "generating_images", "done", "error"]
    message: str
    scenario_id: str | None = None
