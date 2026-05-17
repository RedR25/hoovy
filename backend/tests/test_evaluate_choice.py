"""Tests for the choice evaluation endpoint (POST /api/v1/evaluate/choice).

All tests run with MOCK_AI=true so no Ollama or Kokoro is required.
"""
import pytest


@pytest.fixture(autouse=True)
def enable_mock_ai(monkeypatch):
    monkeypatch.setenv("MOCK_AI", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


async def _create_session(client) -> str:
    r = await client.post(
        "/api/v1/sessions",
        json={"scenario_id": "greet-teacher"},
    )
    assert r.status_code == 201
    return r.json()["id"]


@pytest.mark.anyio
async def test_correct_choice_returns_is_correct_and_advance(client):
    """Posting the correct choice_id → is_correct=True, advance=True."""
    sid = await _create_session(client)
    resp = await client.post(
        "/api/v1/evaluate/choice",
        json={
            "session_id": sid,
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 1,
            "choice_id": "a",  # is_correct=True in greet-teacher step-1
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_correct"] is True
    assert data["advance"] is True
    assert len(data["feedback_audio_b64"]) > 0


@pytest.mark.anyio
async def test_wrong_choice_returns_not_correct_not_advance(client):
    """Posting a wrong choice_id on first attempt → is_correct=False, advance=False."""
    sid = await _create_session(client)
    resp = await client.post(
        "/api/v1/evaluate/choice",
        json={
            "session_id": sid,
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 1,
            "choice_id": "b",  # is_correct=False
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_correct"] is False
    assert data["advance"] is False
    assert data["attempts_remaining"] == 2  # max_attempts=3, used 1


@pytest.mark.anyio
async def test_attempts_remaining_decreases(client):
    """Each wrong attempt reduces attempts_remaining."""
    sid = await _create_session(client)

    # Attempt 1 wrong
    r1 = await client.post(
        "/api/v1/evaluate/choice",
        json={
            "session_id": sid,
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 1,
            "choice_id": "b",
        },
    )
    assert r1.json()["attempts_remaining"] == 2

    # Attempt 2 wrong
    r2 = await client.post(
        "/api/v1/evaluate/choice",
        json={
            "session_id": sid,
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 2,
            "choice_id": "b",
        },
    )
    assert r2.json()["attempts_remaining"] == 1


@pytest.mark.anyio
async def test_wrong_on_last_attempt_forces_advance(client):
    """Wrong choice on max_attempts → advance=True (don't trap the kid)."""
    sid = await _create_session(client)
    resp = await client.post(
        "/api/v1/evaluate/choice",
        json={
            "session_id": sid,
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 3,  # max_attempts=3
            "choice_id": "b",  # wrong
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_correct"] is False
    assert data["advance"] is True
    assert data["attempts_remaining"] == 0


@pytest.mark.anyio
async def test_invalid_choice_id_returns_404(client):
    """choice_id not in step.choices → 404."""
    sid = await _create_session(client)
    resp = await client.post(
        "/api/v1/evaluate/choice",
        json={
            "session_id": sid,
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 1,
            "choice_id": "zzz_nonexistent",
        },
    )
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_choice_trial_logged(client):
    """Posting a choice logs a trial with response_type='choice'."""
    sid = await _create_session(client)
    await client.post(
        "/api/v1/evaluate/choice",
        json={
            "session_id": sid,
            "scenario_id": "greet-teacher",
            "step_id": "step-1",
            "attempt_number": 1,
            "choice_id": "a",
        },
    )
    prog = await client.get(f"/api/v1/sessions/{sid}/progress")
    assert prog.status_code == 200
    data = prog.json()
    assert data["total"] == 1
    assert data["correct"] == 1
