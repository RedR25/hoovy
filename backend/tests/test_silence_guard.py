"""Silence-guard tests.

Goal: prove that a silent / near-silent clip never reaches Ollama.

Strategy:
- Run with MOCK_AI=false so the real audio path is exercised.
- Patch `ollama.Client.chat` to raise if invoked. If the silence guard works,
  the call never happens and the test passes.
"""
from __future__ import annotations

import io
import wave

import pytest

from app.modules.evaluate.audio import SILENCE_DBFS_THRESHOLD, is_silent


def _silent_wav(seconds: float = 2.0, sample_rate: int = 16_000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        n = int(seconds * sample_rate)
        w.writeframes(b"\x00\x00" * n)
    return buf.getvalue()


def _tone_wav(seconds: float = 2.0, sample_rate: int = 16_000, freq: int = 440) -> bytes:
    import math
    import struct
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        n = int(seconds * sample_rate)
        samples = [int(16384 * math.sin(2 * math.pi * freq * i / sample_rate)) for i in range(n)]
        w.writeframes(struct.pack(f"<{n}h", *samples))
    return buf.getvalue()


# ──────────────────────────────────────────────────────────────────────────
# unit tests on is_silent
# ──────────────────────────────────────────────────────────────────────────

def test_silent_wav_detected_as_silent():
    assert is_silent(_silent_wav(seconds=1.0), "wav") is True


def test_loud_tone_not_detected_as_silent():
    assert is_silent(_tone_wav(seconds=1.0), "wav") is False


def test_silence_threshold_is_negative_and_reasonable():
    # Sanity: if someone yanks the threshold to 0, every clip is "silent".
    assert -60.0 < SILENCE_DBFS_THRESHOLD < -30.0


# ──────────────────────────────────────────────────────────────────────────
# integration: silent clip never reaches Gemma
# ──────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_silent_clip_short_circuits_evaluate(monkeypatch, client):
    """POST a silent WAV through /api/v1/evaluate with MOCK_AI=false.

    Expectation: backend returns is_correct=false with the silence feedback,
    and `ollama.Client.chat` is never invoked.
    """
    # Force the real audio path (not mock).
    monkeypatch.setenv("MOCK_AI", "false")
    from app.core.config import get_settings
    get_settings.cache_clear()

    # Trip a loud alarm if Gemma is invoked.
    call_count = {"n": 0}

    def _exploder(*args, **kwargs):
        call_count["n"] += 1
        raise AssertionError(
            "ollama.Client.chat was called — silence guard did NOT short-circuit"
        )

    import ollama
    monkeypatch.setattr(ollama.Client, "chat", _exploder)

    # Create a session so the evaluate route's trial-logging has a parent row.
    session = (
        await client.post(
            "/api/v1/sessions",
            json={"scenario_id": "greet-teacher", "language": "en"},
        )
    ).json()

    r = await client.post(
        "/api/v1/evaluate",
        files={"audio": ("silent.wav", _silent_wav(2.0), "audio/wav")},
        data={
            "session_id": session["id"],
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 1,
        },
    )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["is_correct"] is False, body
    assert call_count["n"] == 0, "Gemma was invoked despite silent input"
    # Feedback text should clearly come from the silence-guard branch.
    assert (
        "hear" in body["feedback"].lower() or "didn" in body["feedback"].lower()
    ), body["feedback"]


@pytest.mark.asyncio
async def test_tone_clip_does_reach_gemma(monkeypatch, client):
    """Sanity check: a loud tone is NOT silent, so it should be sent to Gemma.

    We patch ollama.Client.chat to return a canned JSON response so we don't
    need a real Ollama running.
    """
    monkeypatch.setenv("MOCK_AI", "false")
    from app.core.config import get_settings
    get_settings.cache_clear()

    call_count = {"n": 0}

    def _fake_chat(self, *args, **kwargs):  # noqa: ARG001
        call_count["n"] += 1
        return {
            "message": {
                "content": '{"transcript":"hello","is_correct":true,"confidence":0.9,"feedback":"nice"}'
            }
        }

    import ollama
    monkeypatch.setattr(ollama.Client, "chat", _fake_chat)

    session = (
        await client.post(
            "/api/v1/sessions",
            json={"scenario_id": "greet-teacher", "language": "en"},
        )
    ).json()

    r = await client.post(
        "/api/v1/evaluate",
        files={"audio": ("tone.wav", _tone_wav(2.0), "audio/wav")},
        data={
            "session_id": session["id"],
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 1,
        },
    )

    assert r.status_code == 200, r.text
    assert call_count["n"] == 1, "Gemma should have been called for the non-silent clip"


@pytest.mark.asyncio
async def test_gemma_hallucinated_correct_on_empty_transcript_is_overridden(monkeypatch, client):
    """If Gemma fabricates is_correct=true with empty transcript, override to wrong."""
    monkeypatch.setenv("MOCK_AI", "false")
    from app.core.config import get_settings
    get_settings.cache_clear()

    def _fake_chat(self, *args, **kwargs):  # noqa: ARG001
        # Gemma's hallucination: claims correct, transcribed nothing.
        return {
            "message": {
                "content": '{"transcript":"","is_correct":true,"confidence":0.95,"feedback":"nice"}'
            }
        }

    import ollama
    monkeypatch.setattr(ollama.Client, "chat", _fake_chat)

    session = (
        await client.post(
            "/api/v1/sessions",
            json={"scenario_id": "greet-teacher", "language": "en"},
        )
    ).json()

    r = await client.post(
        "/api/v1/evaluate",
        files={"audio": ("tone.wav", _tone_wav(2.0), "audio/wav")},
        data={
            "session_id": session["id"],
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 1,
        },
    )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["is_correct"] is False, "Hallucinated correct on empty transcript was not overridden"
