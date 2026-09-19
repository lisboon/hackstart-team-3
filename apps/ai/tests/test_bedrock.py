import httpx
import pytest

from app.bedrock import (
    REFRESH_AFTER_SECONDS,
    BedrockTokenAuth,
    MissingAwsCredentialsError,
    mantle_base_url,
)
from app.config import Settings
from app.providers import BedrockProvider, build_provider, probe_provider


def settings(**overrides: object) -> Settings:
    base = {
        "internal_token": "internal-token-for-tests",
        "llm_provider": "bedrock",
        "bedrock_region": "us-east-1",
    }
    return Settings(**{**base, **overrides})  # type: ignore[arg-type]


def test_mantle_base_url_is_region_scoped() -> None:
    assert mantle_base_url("sa-east-1") == "https://bedrock-mantle.sa-east-1.api.aws/v1"


def test_token_is_cached_until_half_life() -> None:
    now = 0.0
    calls: list[str] = []

    def mint(**kwargs: object) -> str:
        calls.append(str(kwargs["region"]))
        return f"token-{len(calls)}"

    auth = BedrockTokenAuth("us-east-1", clock=lambda: now, mint=mint)

    assert auth.token() == "token-1"
    now = REFRESH_AFTER_SECONDS - 1
    assert auth.token() == "token-1"
    now = REFRESH_AFTER_SECONDS
    assert auth.token() == "token-2"
    assert calls == ["us-east-1", "us-east-1"]


def test_forced_remint_bypasses_the_cache() -> None:
    minted = iter(["first", "second"])
    auth = BedrockTokenAuth("us-east-1", clock=lambda: 0.0, mint=lambda **_: next(minted))

    assert auth.token() == "first"
    assert auth.token(force=True) == "second"


def test_missing_credentials_are_reported_as_such() -> None:
    def mint(**_: object) -> str:
        raise RuntimeError("no credentials found")

    auth = BedrockTokenAuth("us-east-1", mint=mint)

    with pytest.raises(MissingAwsCredentialsError):
        auth.token()


def test_auth_flow_signs_and_remints_once_on_401() -> None:
    minted = iter(["stale", "fresh"])
    auth = BedrockTokenAuth("us-east-1", clock=lambda: 0.0, mint=lambda **_: next(minted))

    flow = auth.auth_flow(httpx.Request("POST", "https://example.invalid/v1/chat/completions"))
    first = next(flow)
    assert first.headers["Authorization"] == "Bearer stale"

    retried = flow.send(httpx.Response(401, request=first))
    assert retried.headers["Authorization"] == "Bearer fresh"


def test_probe_is_a_noop_for_providers_that_carry_their_credential() -> None:
    probe_provider(settings(llm_provider="fake"))
    probe_provider(settings(llm_provider="openai", openai_api_key="key"))


def test_build_provider_selects_bedrock_and_its_model() -> None:
    provider = build_provider(settings(bedrock_model="openai.gpt-oss-120b"))

    assert isinstance(provider, BedrockProvider)
    assert provider.name == "bedrock"
    assert provider.model == "openai.gpt-oss-120b"


def test_bedrock_region_is_required() -> None:
    with pytest.raises(ValueError, match="BEDROCK_REGION"):
        settings(bedrock_region="")
