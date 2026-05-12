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


@lru_cache
def get_settings() -> Settings:
    return Settings()
