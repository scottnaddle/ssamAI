"""Service-level configuration via environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8200

    litellm_base_url: str = "http://litellm:4000"
    litellm_api_key: str = "sk-litellm-master-change-me"

    # Default LLM tier used for PPT outline generation.
    # Maps to litellm model_name (lowercase): ssamai-medium → deepseek-chat
    outline_model: str = "ssamai-medium"


settings = Settings()
