"""Environment-driven settings."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8300

    neo4j_uri: str = "bolt://neo4j:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "change-me-neo4j-password"

    litellm_base_url: str = "http://litellm:4000"
    litellm_api_key: str = "sk-litellm-master-change-me"

    # Default LLM tier for skill document generation.
    skill_model: str = "ssamai-medium"


settings = Settings()
