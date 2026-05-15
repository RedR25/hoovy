from pydantic import BaseModel


class EvaluationResult(BaseModel):
    transcript: str
    is_correct: bool
    confidence: float
    feedback: str


class EvaluateResponse(EvaluationResult):
    attempts_remaining: int
    advance: bool
    feedback_audio_b64: str
    hint_image_url: str | None


class EvaluateChoiceRequest(BaseModel):
    session_id: str
    scenario_id: str
    step_id: str
    attempt_number: int
    choice_id: str
