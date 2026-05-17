"""Tests for the images module — Slice 6.

All tests run in placeholder/mock mode (no GEMINI_API_KEY required).
images_dir is redirected to a temp directory so tests don't pollute the
repo's scenarios/_images/ folder and clean up after themselves.
"""
from __future__ import annotations

import os
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base, get_db_session


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def force_mock_ai(monkeypatch):
    """Force placeholder mode: no Gemini calls, no GEMINI_API_KEY needed."""
    monkeypatch.setenv("MOCK_AI", "true")
    # Also clear any real key that might be in the environment
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    # Clear the lru_cache so Settings picks up monkeypatched env
    from app.core.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def tmp_images_dir(tmp_path: Path, monkeypatch):
    """Redirect images_dir to a per-test temp directory."""
    images_dir = tmp_path / "_images"
    images_dir.mkdir()

    # Patch the settings property so service uses tmp dir
    from app.core import config as cfg_module

    original_property = cfg_module.Settings.images_dir.fget  # type: ignore[attr-defined]

    monkeypatch.setattr(
        cfg_module.Settings,
        "images_dir",
        property(lambda self: images_dir),
    )
    # Also patch the singleton cache
    from app.core.config import get_settings
    get_settings.cache_clear()
    yield images_dir
    get_settings.cache_clear()


@pytest.fixture
async def images_client(tmp_images_dir):
    """AsyncClient wired to a fresh in-memory DB + tmp images_dir."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)

    from app.main import create_app

    app = create_app()

    async def _override():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = _override

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    await engine.dispose()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_generate_image_returns_200_and_url(images_client, tmp_images_dir):
    """POST /api/v1/images/generate → 200 with url, file exists on disk."""
    r = await images_client.post(
        "/api/v1/images/generate",
        json={
            "scenario_id": "test-scenario",
            "step_id": "step-1",
            "prompt": "A friendly teacher waving",
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "url" in data
    assert data["url"] == "/static/images/test-scenario/step-1.png"
    assert data["cached"] is False

    # File must exist on disk
    disk_path = tmp_images_dir / "test-scenario" / "step-1.png"
    assert disk_path.exists(), f"Expected file at {disk_path}"
    assert disk_path.stat().st_size > 0


@pytest.mark.asyncio
async def test_generate_image_cached_on_second_call(images_client, tmp_images_dir):
    """Second call with same args returns cached=True without rewriting."""
    payload = {
        "scenario_id": "cache-test",
        "step_id": "step-1",
        "prompt": "A scene",
    }

    r1 = await images_client.post("/api/v1/images/generate", json=payload)
    assert r1.status_code == 200
    assert r1.json()["cached"] is False

    disk_path = tmp_images_dir / "cache-test" / "step-1.png"
    mtime1 = disk_path.stat().st_mtime

    r2 = await images_client.post("/api/v1/images/generate", json=payload)
    assert r2.status_code == 200
    assert r2.json()["cached"] is True
    assert r2.json()["url"] == r1.json()["url"]

    # File was NOT rewritten
    assert disk_path.stat().st_mtime == mtime1


@pytest.mark.asyncio
async def test_generate_hint_image(images_client, tmp_images_dir):
    """kind=hint → different filename."""
    r = await images_client.post(
        "/api/v1/images/generate",
        json={
            "scenario_id": "hint-test",
            "step_id": "step-2",
            "prompt": "Hint illustration",
            "kind": "hint",
        },
    )
    assert r.status_code == 200
    assert r.json()["url"] == "/static/images/hint-test/step-2-hint.png"
    disk_path = tmp_images_dir / "hint-test" / "step-2-hint.png"
    assert disk_path.exists()


@pytest.mark.asyncio
async def test_generate_thumbnail(images_client, tmp_images_dir):
    """kind=thumbnail → thumb.png."""
    r = await images_client.post(
        "/api/v1/images/generate",
        json={
            "scenario_id": "thumb-test",
            "step_id": "thumb",
            "prompt": "Overview thumbnail",
            "kind": "thumbnail",
        },
    )
    assert r.status_code == 200
    assert r.json()["url"] == "/static/images/thumb-test/thumb.png"
    disk_path = tmp_images_dir / "thumb-test" / "thumb.png"
    assert disk_path.exists()


@pytest.mark.asyncio
async def test_generated_file_is_valid_png(images_client, tmp_images_dir):
    """Placeholder PNG starts with the PNG magic bytes."""
    r = await images_client.post(
        "/api/v1/images/generate",
        json={
            "scenario_id": "png-test",
            "step_id": "step-1",
            "prompt": "Test prompt",
        },
    )
    assert r.status_code == 200
    disk_path = tmp_images_dir / "png-test" / "step-1.png"
    magic = disk_path.read_bytes()[:8]
    assert magic == b"\x89PNG\r\n\x1a\n", "File is not a valid PNG"


@pytest.mark.asyncio
async def test_regenerate_scenario_endpoint(images_client, tmp_images_dir):
    """POST /api/v1/images/regenerate/greet-teacher → list of responses."""
    r = await images_client.post("/api/v1/images/regenerate/greet-teacher")
    assert r.status_code == 200, r.text
    items = r.json()
    assert isinstance(items, list)
    # greet-teacher has 3 steps × (scene + hint) + 1 thumbnail = 7 items
    assert len(items) == 7
    urls = [i["url"] for i in items]
    assert "/static/images/greet-teacher/thumb.png" in urls
    assert "/static/images/greet-teacher/step-1.png" in urls
    assert "/static/images/greet-teacher/step-1-hint.png" in urls


@pytest.mark.asyncio
async def test_regenerate_unknown_scenario_returns_404(images_client, tmp_images_dir):
    """POST /api/v1/images/regenerate/no-such → 404."""
    r = await images_client.post("/api/v1/images/regenerate/no-such-scenario")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_force_flag_overwrites_cache(images_client, tmp_images_dir):
    """force=true regenerates even if file exists."""
    payload = {"scenario_id": "force-test", "step_id": "step-1", "prompt": "X"}
    await images_client.post("/api/v1/images/generate", json=payload)

    disk_path = tmp_images_dir / "force-test" / "step-1.png"
    mtime1 = disk_path.stat().st_mtime

    # Introduce a tiny delay so mtime can differ
    import time
    time.sleep(0.05)

    payload["force"] = True
    r = await images_client.post("/api/v1/images/generate", json=payload)
    assert r.status_code == 200
    assert r.json()["cached"] is False
    # File should have been rewritten (mtime changed)
    assert disk_path.stat().st_mtime >= mtime1
