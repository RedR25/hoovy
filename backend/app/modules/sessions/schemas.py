from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SessionCreate(BaseModel):
    scenario_id: str
    language: str = "en"


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scenario_id: str
    language: str
    started_at: datetime
    ended_at: datetime | None


class TrialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    step_id: str
    attempt_number: int
    response_value: str
    response_type: str
    is_correct: bool
    was_prompted: bool
    latency_ms: int
    created_at: datetime


class SessionProgress(BaseModel):
    session_id: str
    total: int
    correct: int
    accuracy: float
    prompt_fade_rate: float


class AttentionLogCreate(BaseModel):
    step_id: str
    on_screen_pct: float
    off_screen_seconds: int
    redirects_triggered: int


class AttentionLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    step_id: str
    on_screen_pct: float
    off_screen_seconds: int
    redirects_triggered: int
    created_at: datetime
