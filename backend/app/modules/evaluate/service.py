"""EvaluateService — the core of Slice 3 + Slice 4.

One Gemma 4 E2B call transcribes audio, evaluates correctness, and generates
feedback text. TTS then wraps that text into the response audio bytes.

For choice steps, no Gemma call is needed: correctness is read directly from
the scenario step's choices[] list (deterministic, fast).
"""
from __future__ import annotations

import asyncio
import base64
import json
import tempfile
from pathlib import Path

from app.core.config import get_settings
from app.modules.evaluate.audio import convert_to_wav_16k_mono
from app.modules.evaluate.schemas import EvaluateChoiceRequest, EvaluateResponse, EvaluationResult
from app.modules.scenarios.schemas import ScenarioStep
from app.modules.scenarios.service import ScenarioService
from app.modules.sessions.service import SessionService
from app.modules.tts.service import TTSService
from app.shared.base.service import BaseService
from app.shared.exceptions import NotFoundError

_PROMPT_PATH = Path(__file__).parent / "prompts" / "evaluate_response.txt"
_PROMPT_TEMPLATE = _PROMPT_PATH.read_text(encoding="utf-8")

_FALLBACK_RESULT = EvaluationResult(
    transcript="",
    is_correct=False,
    confidence=0.0,
    feedback="Sorry, I didn't catch that. Could you try again?",
)

# Deterministic mock alternation: odd attempt = correct, even = wrong.
_MOCK_CORRECT = EvaluationResult(
    transcript="hi ms linh",
    is_correct=True,
    confidence=0.95,
    feedback="Great job! That was a very nice greeting.",
)
_MOCK_WRONG = EvaluationResult(
    transcript="goodbye",
    is_correct=False,
    confidence=0.8,
    feedback="Try saying 'Hi' or 'Hello' to greet the teacher.",
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _pick_feedback_text(step: ScenarioStep, is_correct: bool, attempts_remaining: int, fallback: str) -> str:
    """Return appropriate feedback text for a step evaluation result.

    Shared between audio and choice paths so the wording is consistent.
    """
    if is_correct:
        return step.praise_on_correct or fallback
    elif attempts_remaining > 0:
        return step.hint_on_wrong or fallback
    else:
        return "That's okay! Let's try the next one."


class EvaluateService(BaseService):
    def __init__(
        self,
        scenario_service: ScenarioService,
        session_service: SessionService,
        tts_service: TTSService,
    ) -> None:
        self.scenario_service = scenario_service
        self.session_service = session_service
        self.tts_service = tts_service

    async def _finalize_response(
        self,
        step: ScenarioStep,
        result: EvaluationResult,
        attempt_number: int,
        session_id: str,
        response_type: str,
    ) -> EvaluateResponse:
        """Log trial, synthesize feedback audio, build EvaluateResponse.

        Shared between evaluate_audio and evaluate_choice.
        """
        import time

        latency_ms = 0  # caller may have measured; pass 0 for choice (instant)

        max_attempts = step.max_attempts
        attempts_remaining = max(0, max_attempts - attempt_number)
        advance = result.is_correct or attempts_remaining == 0

        feedback_text = _pick_feedback_text(step, result.is_correct, attempts_remaining, result.feedback)

        await self.session_service.log_trial(
            session_id=session_id,
            step_id=step.id,
            attempt_number=attempt_number,
            response_value=result.transcript,
            response_type=response_type,
            is_correct=result.is_correct,
            was_prompted=attempt_number > 1,
            latency_ms=latency_ms,
        )

        loop = asyncio.get_event_loop()
        wav_bytes_tts: bytes = await loop.run_in_executor(
            None, lambda: self.tts_service.synthesize(feedback_text)
        )
        feedback_audio_b64 = base64.b64encode(wav_bytes_tts).decode()

        return EvaluateResponse(
            transcript=result.transcript,
            is_correct=result.is_correct,
            confidence=result.confidence,
            feedback=feedback_text,
            attempts_remaining=attempts_remaining,
            advance=advance,
            feedback_audio_b64=feedback_audio_b64,
            hint_image_url=step.hint_image_url if not result.is_correct else None,
        )

    async def evaluate_audio(
        self,
        session_id: str,
        scenario_id: str,
        step_id: str,
        attempt_number: int,
        audio_bytes: bytes,
        source_format: str | None,
    ) -> EvaluateResponse:
        import time

        t0 = time.monotonic()

        scenario = self.scenario_service.get(scenario_id)
        step = next((s for s in scenario.steps if s.id == step_id), None)
        if step is None:
            raise NotFoundError(f"step '{step_id}' not found in scenario '{scenario_id}'")

        settings = get_settings()

        if settings.mock_ai:
            result = _MOCK_CORRECT if attempt_number % 2 == 1 else _MOCK_WRONG
        else:
            wav_bytes = convert_to_wav_16k_mono(audio_bytes, source_format)

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(wav_bytes)
                wav_path = Path(tmp.name)

            try:
                expected = step.voice_accepts or [c.text for c in step.choices if c.is_correct]
                system_prompt = _PROMPT_TEMPLATE.format(
                    teacher_prompt=step.teacher_prompt,
                    expected=expected,
                    attempt=attempt_number,
                )

                loop = asyncio.get_event_loop()

                def _ollama_call() -> str:
                    import ollama  # noqa: PLC0415

                    client = ollama.Client(host=settings.ollama_host)
                    response = client.chat(
                        model=settings.ollama_model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {
                                "role": "user",
                                "content": "Evaluate the child's audio response.",
                                "images": [str(wav_path)],
                            },
                        ],
                        format="json",
                        options={"temperature": 0.4},
                    )
                    return response["message"]["content"]

                raw = await loop.run_in_executor(None, _ollama_call)

                try:
                    data = json.loads(raw)
                    result = EvaluationResult(**data)
                except Exception:
                    result = _FALLBACK_RESULT
            finally:
                wav_path.unlink(missing_ok=True)

        return await self._finalize_response(
            step=step,
            result=result,
            attempt_number=attempt_number,
            session_id=session_id,
            response_type="voice",
        )

    async def evaluate_choice(
        self,
        req: EvaluateChoiceRequest,
    ) -> EvaluateResponse:
        """Score a tapped choice against step.choices[].is_correct.

        No Gemma call — deterministic, fast. Respects mock_ai only for TTS
        (TTSService already handles that internally).
        """
        scenario = self.scenario_service.get(req.scenario_id)
        step = next((s for s in scenario.steps if s.id == req.step_id), None)
        if step is None:
            raise NotFoundError(f"step '{req.step_id}' not found in scenario '{req.scenario_id}'")

        # Find the chosen option
        choice = next((c for c in step.choices if c.id == req.choice_id), None)
        if choice is None:
            raise NotFoundError(
                f"choice '{req.choice_id}' not found in step '{req.step_id}'"
            )

        is_correct = choice.is_correct
        result = EvaluationResult(
            transcript=choice.text,
            is_correct=is_correct,
            confidence=1.0,  # choice is deterministic
            feedback=step.praise_on_correct if is_correct else (step.hint_on_wrong or ""),
        )

        return await self._finalize_response(
            step=step,
            result=result,
            attempt_number=req.attempt_number,
            session_id=req.session_id,
            response_type="choice",
        )
