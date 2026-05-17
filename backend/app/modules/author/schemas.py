"""Pydantic schemas for the author module."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.modules.scenarios.schemas import Scenario, SkillDomain

Complexity = Literal["low", "med", "high"]


class AuthorRequest(BaseModel):
    """Parent-facing request for AI scenario generation.

    `skill_target` is what the kid is learning ("Going to the grocery store").
    `child_interests` is the theming hook ("Trains", "Dinosaurs"). Mapped into
    the system prompt so Gemma weaves it through the scenario.
    `complexity` maps to internal difficulty 1/2/3.
    """

    skill_target: str = Field(..., min_length=3, max_length=200)
    child_interests: str = Field(..., min_length=1, max_length=200)
    complexity: Complexity = "med"
    skill_domain: SkillDomain = "communication"
    num_steps: int = Field(default=3, ge=1, le=5)


class DraftResponse(BaseModel):
    """A pending scenario waiting on publish. Lives in-memory only."""

    draft_id: str
    scenario: Scenario


class PublishRequest(BaseModel):
    draft_id: str


class AuthorProgressEvent(BaseModel):
    phase: Literal["generating_scenario", "validating", "generating_images", "done", "error"]
    message: str
    scenario_id: str | None = None


def complexity_to_difficulty(c: Complexity) -> int:
    return {"low": 1, "med": 2, "high": 3}[c]
