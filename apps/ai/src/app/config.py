from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8000
    internal_token: str
    llm_provider: Literal["openai", "bedrock", "fake"] = "openai"
    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"
    # Region of the bedrock-mantle host, which is also where the short-term API
    # key is valid: a token minted for one region is rejected by every other.
    bedrock_region: str = "us-east-1"
    bedrock_model: str = "openai.gpt-oss-120b"
    system_prompt: str = (
        "You are a concise assistant. Use only the data supplied by the application "
        "and state uncertainty. Do not invent facts, sources, or completed actions."
    )
    run_timeout_seconds: float = Field(default=50, gt=0, le=300)
    production: bool = False

    @model_validator(mode="after")
    def validate_runtime(self) -> "Settings":
        if len(self.internal_token) < 16:
            raise ValueError("INTERNAL_TOKEN must contain at least 16 characters")
        if self.production and self.llm_provider == "fake":
            raise ValueError("LLM_PROVIDER=fake is forbidden in production")
        if self.llm_provider == "openai" and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        if self.llm_provider == "bedrock" and not self.bedrock_region:
            raise ValueError("BEDROCK_REGION is required when LLM_PROVIDER=bedrock")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
