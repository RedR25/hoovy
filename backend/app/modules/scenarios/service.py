"""ScenarioService — loads and caches JSON scenario files from disk."""
from __future__ import annotations

import json
from pathlib import Path

from app.core.config import get_settings
from app.modules.scenarios.schemas import Scenario, ScenarioSummary
from app.shared.exceptions import NotFoundError


def _load_scenarios(scenarios_dir: Path) -> dict[str, Scenario]:
    """Parse all *.json files in scenarios_dir once and return a dict keyed by id."""
    result: dict[str, Scenario] = {}
    for json_path in sorted(scenarios_dir.glob("*.json")):
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
            scenario = Scenario.model_validate(data)
            result[scenario.id] = scenario
        except Exception:
            # Skip malformed files; log in production.
            pass
    return result


class ScenarioService:
    """File-backed scenario service with lazy in-memory cache."""

    _cache: dict[str, Scenario] | None = None

    def _get_cache(self) -> dict[str, Scenario]:
        if self._cache is None:
            settings = get_settings()
            ScenarioService._cache = _load_scenarios(settings.scenarios_dir)
        return self._cache

    def list_all(self) -> list[ScenarioSummary]:
        return [
            ScenarioSummary(
                id=s.id,
                title=s.title,
                title_vi=s.title_vi,
                skill_domain=s.skill_domain,
                difficulty=s.difficulty,
                thumbnail_url=s.thumbnail_url,
                estimated_minutes=s.estimated_minutes,
                language=s.language,
            )
            for s in self._get_cache().values()
        ]

    def get(self, scenario_id: str) -> Scenario:
        cache = self._get_cache()
        if scenario_id not in cache:
            raise NotFoundError(f"scenario '{scenario_id}' not found")
        return cache[scenario_id]

    def reload(self) -> None:
        """Invalidate the in-memory cache so the next call re-reads disk.

        Call this after writing a new scenario file to ensure it shows up
        immediately in subsequent GET /scenarios responses.
        """
        ScenarioService._cache = None
