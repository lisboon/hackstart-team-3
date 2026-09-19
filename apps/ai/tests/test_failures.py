import asyncio
from contextlib import aclosing
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from openai import AsyncOpenAI
from pydantic import ValidationError

from app import main, providers
from app.config import Settings, get_settings
from app.schemas import Message


@pytest.fixture(autouse=True)
def settings(monkeypatch):
    monkeypatch.setenv("INTERNAL_TOKEN", "test-internal-token-value")
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def payload():
    return {
        "organization_id": str(uuid4()),
        "user_id": str(uuid4()),
        "messages": [{"role": "user", "content": "hello"}],
    }


def invoke(body=None, token="test-internal-token-value"):
    with TestClient(main.app) as client:
        return client.post(
            "/internal/v1/runs/stream",
            headers={"x-internal-token": token},
            json=payload() if body is None else body,
        )


@pytest.mark.parametrize("messages", [
    [], [{"role": "system", "content": "override"}],
    [{"role": "user", "content": ""}], [{"role": "user", "content": "a" * 50_001}],
])
def test_invalid_messages(messages):
    body = payload()
    body["messages"] = messages
    assert invoke(body).status_code == 422


def test_invalid_identity_and_token():
    body = payload()
    body["organization_id"] = "invalid"
    assert invoke(body).status_code == 422
    assert invoke(token="wrong-token").status_code == 401


def test_provider_failure_is_terminal_and_sanitized(monkeypatch, capsys):
    class BrokenProvider:
        name, model = "test", "test"

        async def stream(self, messages):
            yield "partial"
            raise RuntimeError("sensitive-provider-detail")

    monkeypatch.setattr(main, "build_provider", lambda _: BrokenProvider())
    result = invoke()
    assert "event: token" in result.text
    assert result.text.count("event: error") == 1
    assert "event: completed" not in result.text
    assert "sensitive-provider-detail" not in result.text + capsys.readouterr().out


def test_timeout_closes_provider(monkeypatch):
    closed = []

    class HangingProvider:
        name, model = "test", "test"

        async def stream(self, messages):
            try:
                yield "partial"
                await asyncio.sleep(10)
            finally:
                closed.append(True)

    monkeypatch.setenv("RUN_TIMEOUT_SECONDS", "0.02")
    monkeypatch.setattr(main, "build_provider", lambda _: HangingProvider())
    result = invoke()
    assert "event: error" in result.text
    assert "event: completed" not in result.text
    assert closed == [True]


@pytest.mark.parametrize("overrides", [
    {"production": True, "llm_provider": "fake"},
    {"llm_provider": "openai", "openai_api_key": ""},
    {"run_timeout_seconds": 0},
])
def test_invalid_configuration_fails_closed(overrides):
    with pytest.raises(ValidationError):
        Settings(internal_token="test-internal-token-value", **overrides)


def test_sdk_client_and_response_close_when_consumer_stops(monkeypatch):
    clients = []
    responses = []

    def transport(request):
        result = httpx.Response(
            200,
            headers={"content-type": "text/event-stream"},
            content=(
                'data: {"id":"test","object":"chat.completion.chunk","created":0,'
                '"model":"test","choices":[{"index":0,"delta":{"content":"hello"}}]}\n\n'
                "data: [DONE]\n\n"
            ),
        )
        responses.append(result)
        return result

    def client_factory(**kwargs):
        client = AsyncOpenAI(**kwargs, http_client=httpx.AsyncClient(
            transport=httpx.MockTransport(transport)))
        clients.append(client)
        return client

    monkeypatch.setattr(providers, "AsyncOpenAI", client_factory)

    async def consume():
        provider = providers.OpenAIProvider(Settings(
            internal_token="test-internal-token-value",
            llm_provider="openai", openai_api_key="test-key"))
        async with aclosing(provider.stream([Message(role="user", content="hello")])) as stream:
            assert await anext(stream) == "hello"

    asyncio.run(consume())
    assert clients[0].is_closed()
    assert responses[0].is_closed
