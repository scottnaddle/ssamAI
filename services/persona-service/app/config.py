"""Environment-driven settings."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8100

    neo4j_uri: str = "bolt://neo4j:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "change-me-neo4j-password"

    litellm_base_url: str = "http://litellm:4000"
    litellm_api_key: str = "sk-litellm-master-change-me"

    graphiti_group_id: str = "default-teacher-group"


settings = Settings()
