from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "hoovy"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = "sqlite+aiosqlite:///./hoovy.db"

    secret_key: str = Field(default="change-me", min_length=8)
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    # Path to the built SPA (`frontend/dist`). Unset in dev — Vite serves the
    # SPA on :5173 with HMR. Set in Docker so the backend serves it directly.
    static_dir: Path | None = None

    # Repo-root scenarios/ folder, version-controlled. The loader scans *.json.
    scenarios_dir: Path = Path(__file__).resolve().parents[3] / "scenarios"

    # Ollama (local). Gemma 4 E2B handles audio understanding + reasoning.
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "gemma4:e2b"
    ollama_timeout_s: float = 60.0

    # Kokoro TTS — Python library, used in-process (matches experiments/).
    kokoro_voice: str = "af_bella"
    kokoro_speed: float = 0.9
    kokoro_lang_code: str = "a"  # 'a' = American English

    # Demo language flag — flips Kokoro voice + scenario field selection.
    language: str = "en"

    # Mock mode: returns canned AI responses, no Ollama/Kokoro calls.
    # Useful when models are slow or the venue network is flaky.
    mock_ai: bool = False

    # Ollama authoring model (separate from runtime model — can be larger for quality).
    # Override with OLLAMA_AUTHOR_MODEL=gemma4:e4b for better scenario quality.
    ollama_author_model: str = "gemma4:e2b"
    # Longer timeout for authoring (one-shot admin call, latency is acceptable).
    ollama_author_timeout_s: float = 180.0

    # Gemini image generation (Nano Banana — Gemini 2.5 Flash Image).
    gemini_api_key: str | None = None
    gemini_image_model: str = "gemini-2.5-flash-preview-05-20"
    image_style_preset: str = (
        "kid-friendly cartoon illustration, soft warm pastel colors, simple rounded shapes, "
        "diverse characters, plain neutral background, no text, no logos, age 6-10 picture-book style"
    )

    @property
    def images_dir(self) -> Path:
        return self.scenarios_dir / "_images"


@lru_cache
def get_settings() -> Settings:
    return Settings()
