"""Tests for the attention log endpoint."""
import pytest


@pytest.mark.anyio
async def test_log_attention_created(client, monkeypatch):
    monkeypatch.setenv("MOCK_AI", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()

    # Create a session first
    create = await client.post(
        "/api/v1/sessions",
        json={"scenario_id": "greet-teacher", "language": "en"},
    )
    assert create.status_code == 201
    sid = create.json()["id"]

    # Post an attention log
    payload = {
        "step_id": "step-1",
        "on_screen_pct": 0.85,
        "off_screen_seconds": 4,
        "redirects_triggered": 1,
    }
    resp = await client.post(f"/api/v1/sessions/{sid}/attention", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["session_id"] == sid
    assert data["step_id"] == "step-1"
    assert data["on_screen_pct"] == pytest.approx(0.85)
    assert data["off_screen_seconds"] == 4
    assert data["redirects_triggered"] == 1
    assert "id" in data
    assert "created_at" in data


@pytest.mark.anyio
async def test_log_attention_multiple_steps(client, monkeypatch):
    monkeypatch.setenv("MOCK_AI", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()

    create = await client.post(
        "/api/v1/sessions",
        json={"scenario_id": "greet-teacher"},
    )
    sid = create.json()["id"]

    for i in range(3):
        resp = await client.post(
            f"/api/v1/sessions/{sid}/attention",
            json={
                "step_id": f"step-{i}",
                "on_screen_pct": 1.0 - i * 0.1,
                "off_screen_seconds": i * 2,
                "redirects_triggered": i,
            },
        )
        assert resp.status_code == 201
        assert resp.json()["step_id"] == f"step-{i}"


@pytest.mark.anyio
async def test_log_attention_missing_session(client):
    resp = await client.post(
        "/api/v1/sessions/nonexistent-session-id/attention",
        json={
            "step_id": "step-1",
            "on_screen_pct": 0.9,
            "off_screen_seconds": 0,
            "redirects_triggered": 0,
        },
    )
    assert resp.status_code == 404
