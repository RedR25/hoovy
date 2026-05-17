"""Tests for the sessions module."""
import pytest


@pytest.mark.anyio
async def test_create_session(client, monkeypatch):
    monkeypatch.setenv("MOCK_AI", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()

    resp = await client.post(
        "/api/v1/sessions",
        json={"scenario_id": "greet-teacher", "language": "en"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["scenario_id"] == "greet-teacher"
    assert data["ended_at"] is None


@pytest.mark.anyio
async def test_get_progress_empty(client, monkeypatch):
    monkeypatch.setenv("MOCK_AI", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()

    create = await client.post(
        "/api/v1/sessions",
        json={"scenario_id": "greet-teacher"},
    )
    sid = create.json()["id"]

    resp = await client.get(f"/api/v1/sessions/{sid}/progress")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["correct"] == 0
    assert data["accuracy"] == 0.0


@pytest.mark.anyio
async def test_end_session(client, monkeypatch):
    monkeypatch.setenv("MOCK_AI", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()

    create = await client.post(
        "/api/v1/sessions",
        json={"scenario_id": "greet-teacher"},
    )
    sid = create.json()["id"]

    resp = await client.post(f"/api/v1/sessions/{sid}/end")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ended_at"] is not None


@pytest.mark.anyio
async def test_progress_not_found(client):
    resp = await client.get("/api/v1/sessions/nonexistent/progress")
    assert resp.status_code == 404
