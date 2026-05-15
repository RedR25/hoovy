"""Pydantic schemas for scenario data loaded from JSON files."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


ResponseType = Literal["voice", "choice", "tap", "voice_or_choice"]
SkillDomain = Literal["communication", "money", "time", "social", "practical"]


class Choice(BaseModel):
    id: str
    text: str
    is_correct: bool


class ScenarioStep(BaseModel):
    id: str
    order: int
    teacher_prompt: str
    teacher_prompt_vi: str
    scene_image_url: str | None = None
    scene_image_prompt: str | None = None
    response_type: ResponseType
    choices: list[Choice] = []
    voice_accepts: list[str] = []
    hint_on_wrong: str | None = None
    hint_image_url: str | None = None
    praise_on_correct: str | None = None
    max_attempts: int = 3


class Scenario(BaseModel):
    id: str
    title: str
    title_vi: str
    skill_domain: SkillDomain
    difficulty: int
    thumbnail_url: str | None = None
    estimated_minutes: int
    language: str
    steps: list[ScenarioStep]


class ScenarioSummary(BaseModel):
    id: str
    title: str
    title_vi: str
    skill_domain: SkillDomain
    difficulty: int
    thumbnail_url: str | None = None
    estimated_minutes: int
    language: str
