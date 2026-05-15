from fastapi import APIRouter, File, Form, UploadFile

from app.modules.evaluate.dependencies import EvaluateServiceDep
from app.modules.evaluate.schemas import EvaluateChoiceRequest, EvaluateResponse

router = APIRouter(prefix="/evaluate", tags=["evaluate"])


@router.post("", response_model=EvaluateResponse)
async def evaluate_audio(
    session_id: str = Form(...),
    scenario_id: str = Form(...),
    step_id: str = Form(...),
    attempt_number: int = Form(...),
    audio: UploadFile = File(...),
    service: EvaluateServiceDep = ...,
) -> EvaluateResponse:
    audio_bytes = await audio.read()
    content_type = audio.content_type or ""
    # Sniff format from content_type so pydub knows the container.
    if "webm" in content_type:
        fmt = "webm"
    elif "ogg" in content_type:
        fmt = "ogg"
    elif "mp4" in content_type or "m4a" in content_type:
        fmt = "mp4"
    else:
        fmt = None  # let pydub sniff (works for wav/mp3)

    return await service.evaluate_audio(
        session_id=session_id,
        scenario_id=scenario_id,
        step_id=step_id,
        attempt_number=attempt_number,
        audio_bytes=audio_bytes,
        source_format=fmt,
    )


@router.post("/choice", response_model=EvaluateResponse)
async def evaluate_choice(
    req: EvaluateChoiceRequest,
    service: EvaluateServiceDep = ...,
) -> EvaluateResponse:
    """Score a tapped choice against step.choices[].is_correct.

    No Gemma call needed — correctness is read directly from the scenario JSON.
    """
    return await service.evaluate_choice(req)
