"""Async tests for the /api/v1/scenarios endpoints."""
import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.anyio
async def test_list_scenarios_contains_greet_teacher(client: AsyncClient) -> None:
    response = await client.get("/api/v1/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    ids = [s["id"] for s in data]
    assert "greet-teacher" in ids

    summary = next(s for s in data if s["id"] == "greet-teacher")
    assert summary["title"] == "Greeting the teacher"
    assert summary["skill_domain"] == "communication"
    assert summary["difficulty"] == 1
    assert summary["estimated_minutes"] == 3
    assert summary["language"] == "en"
    # Summary must NOT expose steps
    assert "steps" not in summary


@pytest.mark.anyio
async def test_get_scenario_greet_teacher(client: AsyncClient) -> None:
    response = await client.get("/api/v1/scenarios/greet-teacher")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "greet-teacher"
    assert data["title_vi"] == "Chào cô giáo"
    steps = data["steps"]
    assert len(steps) == 3
    # Validate step shape
    first = steps[0]
    assert first["id"] == "step-1"
    assert first["order"] == 1
    assert first["response_type"] == "voice_or_choice"
    assert len(first["choices"]) == 3


@pytest.mark.anyio
async def test_get_scenario_unknown_returns_404(client: AsyncClient) -> None:
    response = await client.get("/api/v1/scenarios/does-not-exist")
    assert response.status_code == 404
