"""Tests for POST /api/v1/author/scenario — all run with MOCK_AI=true."""
from __future__ import annotations

import json
import os
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import AsyncClient

# Force mock AI for all tests in this module
os.environ.setdefault("MOCK_AI", "true")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _valid_request() -> dict:
    return {
        "skill_domain": "communication",
        "brief": "Teach kid to greet a shopkeeper politely",
        "difficulty": 1,
        "num_steps": 2,
        "language": "en",
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_author_scenario_returns_200_and_scenario_shape(client: AsyncClient, tmp_path: Path) -> None:
    """POST /author/scenario with MOCK_AI returns a valid Scenario-shaped response."""
    # Patch scenarios_dir to tmp_path so we don't pollute the repo
    from app.core.config import get_settings
    from app.modules.scenarios import dependencies as sc_deps
    from app.modules.scenarios.service import ScenarioService

    original_dir = get_settings().scenarios_dir
    get_settings().scenarios_dir = tmp_path  # type: ignore[misc]

    # Reset module-level singleton to use new dir
    sc_deps._service = ScenarioService()

    try:
        response = await client.post("/api/v1/author/scenario", json=_valid_request())
        assert response.status_code == 200, response.text

        data = response.json()
        # Required top-level fields
        assert "id" in data
        assert "title" in data
        assert "title_vi" in data
        assert "skill_domain" in data
        assert "difficulty" in data
        assert "steps" in data
        assert "language" in data
        assert "estimated_minutes" in data

        # Correct values
        assert data["skill_domain"] == "communication"
        assert data["difficulty"] == 1
        assert data["language"] == "en"
        assert len(data["steps"]) == 2

        # Step shape
        step = data["steps"][0]
        assert "id" in step
        assert "teacher_prompt" in step
        assert "teacher_prompt_vi" in step
        assert "response_type" in step

        # File was written to tmp_path
        slug = data["id"]
        assert (tmp_path / f"{slug}.json").exists()

    finally:
        get_settings().scenarios_dir = original_dir  # type: ignore[misc]
        sc_deps._service = ScenarioService()


@pytest.mark.anyio
async def test_author_scenario_appears_in_scenario_list(client: AsyncClient, tmp_path: Path) -> None:
    """After authoring, GET /scenarios includes the new scenario."""
    from app.core.config import get_settings
    from app.modules.scenarios import dependencies as sc_deps
    from app.modules.scenarios.service import ScenarioService
    import shutil

    original_dir = get_settings().scenarios_dir

    # Copy the greet-teacher fixture into tmp_path so the list isn't empty
    shutil.copy(original_dir / "greet-teacher.json", tmp_path / "greet-teacher.json")

    get_settings().scenarios_dir = tmp_path  # type: ignore[misc]
    sc_deps._service = ScenarioService()

    try:
        # Author a new scenario
        author_resp = await client.post("/api/v1/author/scenario", json=_valid_request())
        assert author_resp.status_code == 200
        new_id = author_resp.json()["id"]

        # List should contain it
        list_resp = await client.get("/api/v1/scenarios")
        assert list_resp.status_code == 200
        ids = [s["id"] for s in list_resp.json()]
        assert new_id in ids
        assert "greet-teacher" in ids

    finally:
        get_settings().scenarios_dir = original_dir  # type: ignore[misc]
        sc_deps._service = ScenarioService()


@pytest.mark.anyio
async def test_author_scenario_invalid_difficulty_returns_422(client: AsyncClient) -> None:
    """difficulty=10 is out of range (1..3) → 422."""
    bad = _valid_request()
    bad["difficulty"] = 10
    response = await client.post("/api/v1/author/scenario", json=bad)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_author_scenario_invalid_num_steps_returns_422(client: AsyncClient) -> None:
    """num_steps=99 is out of range (1..5) → 422."""
    bad = _valid_request()
    bad["num_steps"] = 99
    response = await client.post("/api/v1/author/scenario", json=bad)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_author_scenario_invalid_skill_domain_returns_422(client: AsyncClient) -> None:
    """Unknown skill_domain → 422."""
    bad = _valid_request()
    bad["skill_domain"] = "flying"
    response = await client.post("/api/v1/author/scenario", json=bad)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_author_scenario_missing_brief_returns_422(client: AsyncClient) -> None:
    """Missing brief → 422."""
    bad = {
        "skill_domain": "communication",
        "difficulty": 1,
        "num_steps": 2,
    }
    response = await client.post("/api/v1/author/scenario", json=bad)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_author_scenario_money_domain(client: AsyncClient, tmp_path: Path) -> None:
    """Money domain mock scenario has correct skill_domain."""
    from app.core.config import get_settings
    from app.modules.scenarios import dependencies as sc_deps
    from app.modules.scenarios.service import ScenarioService

    original_dir = get_settings().scenarios_dir
    get_settings().scenarios_dir = tmp_path  # type: ignore[misc]
    sc_deps._service = ScenarioService()

    try:
        req = {
            "skill_domain": "money",
            "brief": "Teach kid to pay for a snack",
            "difficulty": 2,
            "num_steps": 3,
            "language": "en",
        }
        response = await client.post("/api/v1/author/scenario", json=req)
        assert response.status_code == 200
        data = response.json()
        assert data["skill_domain"] == "money"
        assert data["difficulty"] == 2
        assert len(data["steps"]) == 3
        # All steps have teacher_prompt_vi filled
        for step in data["steps"]:
            assert step.get("teacher_prompt_vi"), f"teacher_prompt_vi empty in {step['id']}"
    finally:
        get_settings().scenarios_dir = original_dir  # type: ignore[misc]
        sc_deps._service = ScenarioService()


@pytest.mark.anyio
async def test_author_scenario_slug_collision_resolved(client: AsyncClient, tmp_path: Path) -> None:
    """If the same brief is submitted twice, slugs are unique (no overwrite)."""
    from app.core.config import get_settings
    from app.modules.scenarios import dependencies as sc_deps
    from app.modules.scenarios.service import ScenarioService

    original_dir = get_settings().scenarios_dir
    get_settings().scenarios_dir = tmp_path  # type: ignore[misc]
    sc_deps._service = ScenarioService()

    req = _valid_request()

    try:
        resp1 = await client.post("/api/v1/author/scenario", json=req)
        assert resp1.status_code == 200
        id1 = resp1.json()["id"]

        # Reset service cache so second call re-reads disk
        sc_deps._service.reload()

        resp2 = await client.post("/api/v1/author/scenario", json=req)
        assert resp2.status_code == 200
        id2 = resp2.json()["id"]

        # Both files exist and slugs differ
        assert (tmp_path / f"{id1}.json").exists()
        assert (tmp_path / f"{id2}.json").exists()
        assert id1 != id2

    finally:
        get_settings().scenarios_dir = original_dir  # type: ignore[misc]
        sc_deps._service = ScenarioService()
