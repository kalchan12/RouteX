"""Application settings loaded from environment variables.

Never hard-code credentials. Everything comes from ``.env`` (which is git
ignored) or the process environment.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    database_url: str = "sqlite:///./routex.db"
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    log_level: str = "INFO"

    ai_enabled: bool = False
    ai_provider: str = ""
    ai_api_key: str = ""

    cors_origins: list[str] = ["http://localhost:3000"]

    # Simulation defaults
    default_max_ticks: int = 600
    default_speed: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
