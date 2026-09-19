from collections.abc import AsyncIterator
from typing import Protocol

import httpx
from openai import AsyncOpenAI

from app.bedrock import BedrockTokenAuth, mantle_base_url
from app.config import Settings
from app.schemas import Message


class Provider(Protocol):
    name: str
    model: str

    def stream(self, messages: list[Message]) -> AsyncIterator[str]: ...


async def _stream_chat(
    client: AsyncOpenAI,
    model: str,
    system_prompt: str,
    messages: list[Message],
) -> AsyncIterator[str]:
    """The wire call shared by every OpenAI-protocol provider."""
    stream = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            *[{"role": item.role, "content": item.content} for item in messages],
        ],
        stream=True,
    )
    async with stream:
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta


class OpenAIProvider:
    name = "openai"

    def __init__(self, settings: Settings) -> None:
        self.model = settings.openai_model
        self._system_prompt = settings.system_prompt
        self._api_key = settings.openai_api_key
        self._timeout = settings.run_timeout_seconds

    async def stream(self, messages: list[Message]) -> AsyncIterator[str]:
        async with AsyncOpenAI(
            api_key=self._api_key, timeout=self._timeout, max_retries=0
        ) as client:
            async for delta in _stream_chat(
                client, self.model, self._system_prompt, messages
            ):
                yield delta


class BedrockProvider:
    """Same protocol as OpenAI, different host and a per-request bearer token."""

    name = "bedrock"

    def __init__(self, settings: Settings) -> None:
        self.model = settings.bedrock_model
        self._system_prompt = settings.system_prompt
        self._region = settings.bedrock_region
        self._timeout = settings.run_timeout_seconds

    async def stream(self, messages: list[Message]) -> AsyncIterator[str]:
        auth = BedrockTokenAuth(self._region)
        async with httpx.AsyncClient(auth=auth, timeout=self._timeout) as http_client:
            async with AsyncOpenAI(
                # Replaced on every request by the auth hook. The SDK only insists
                # the key is non-empty, and a real one would go stale anyway.
                api_key="bedrock",
                base_url=mantle_base_url(self._region),
                http_client=http_client,
                timeout=self._timeout,
                max_retries=0,
            ) as client:
                async for delta in _stream_chat(
                    client, self.model, self._system_prompt, messages
                ):
                    yield delta


class FakeProvider:
    """Deterministic adapter for tests and local contract development only."""

    name = "fake"
    model = "deterministic-test-provider"

    async def stream(self, messages: list[Message]) -> AsyncIterator[str]:
        yield f"Test response: {messages[-1].content}"


def probe_provider(settings: Settings) -> None:
    """Resolves the credential now, so readiness fails before a user does.

    Only bedrock needs it: the other providers carry their credential in the
    settings, which the validator has already checked.
    """
    if settings.llm_provider == "bedrock":
        BedrockTokenAuth(settings.bedrock_region).token()


def build_provider(settings: Settings) -> Provider:
    if settings.llm_provider == "fake":
        return FakeProvider()
    if settings.llm_provider == "bedrock":
        return BedrockProvider(settings)
    return OpenAIProvider(settings)
