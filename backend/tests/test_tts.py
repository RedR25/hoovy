"""Tests for the /api/v1/tts endpoint.

Uses MOCK_AI=true so Kokoro never loads — tests run in milliseconds.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.core.config import get_settings


@pytest.fixture(autouse=True)
def mock_ai_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force mock_ai=True and clear the lru_cache so Settings re-reads env."""
    monkeypatch.setenv("MOCK_AI", "true")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.anyio
async def test_tts_returns_wav(client: AsyncClient) -> None:
    response = await client.post("/api/v1/tts", json={"text": "Hello"})
    assert response.status_code == 200
    assert "audio/wav" in response.headers["content-type"]
    body = response.content
    assert body[:4] == b"RIFF"
    assert b"WAVE" in body[:12]


@pytest.mark.anyio
async def test_tts_empty_text_still_returns_wav(client: AsyncClient) -> None:
    # Empty text in mock mode still returns the canned sine wave
    response = await client.post("/api/v1/tts", json={"text": ""})
    assert response.status_code == 200
    assert "audio/wav" in response.headers["content-type"]


@pytest.mark.anyio
async def test_tts_missing_body_returns_422(client: AsyncClient) -> None:
    response = await client.post("/api/v1/tts", content=b"")
    assert response.status_code == 422


@pytest.mark.anyio
async def test_tts_accepts_optional_voice_and_speed(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/tts",
        json={"text": "Test", "voice": "af_bella", "speed": 1.0},
    )
    assert response.status_code == 200
