"""Tests for the warmup endpoint."""
import pytest


@pytest.fixture(autouse=True)
def enable_mock_ai(monkeypatch):
    monkeypatch.setenv("MOCK_AI", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.anyio
async def test_warmup_mock_mode_returns_skipped(client):
    """With MOCK_AI=true, warmup reports both services as skipped."""
    # Reset warmup status to pending (fresh lifespan sets it during startup,
    # but in mock mode run_warmup sets them to 'skipped' synchronously).
    from app.modules.warmup import service as ws

    ws._status["kokoro"] = "pending"
    ws._status["ollama"] = "pending"

    # Trigger the warmup coroutine directly (tests don't go through lifespan)
    await ws.run_warmup()

    resp = await client.post("/api/v1/warmup")
    assert resp.status_code == 200
    data = resp.json()
    assert data["kokoro"] == "skipped"
    assert data["ollama"] == "skipped"


@pytest.mark.anyio
async def test_warmup_get_also_works(client):
    """GET /api/v1/warmup returns current status."""
    resp = await client.get("/api/v1/warmup")
    assert resp.status_code == 200
    data = resp.json()
    assert "kokoro" in data
    assert "ollama" in data
