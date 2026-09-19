import asyncio
from collections.abc import AsyncIterator
from contextlib import aclosing
from secrets import compare_digest
from uuid import uuid4

import structlog
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.responses import StreamingResponse

from app.bedrock import MissingAwsCredentialsError
from app.config import Settings, get_settings
from app.providers import build_provider, probe_provider
from app.schemas import RunRequest, StreamEvent

log = structlog.get_logger()
app = FastAPI(title="hackathon-star-ai", version="0.1.0", docs_url=None, redoc_url=None)


def require_internal_token(
    x_internal_token: str = Header(default=""),
    settings: Settings = Depends(get_settings),
) -> None:
    if not compare_digest(x_internal_token.encode(), settings.internal_token.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")


@app.get("/health/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
async def ready(settings: Settings = Depends(get_settings)) -> dict[str, str]:
    # Building a provider proves nothing on its own: under bedrock the token is
    # minted lazily on the first real request, so a container with no permission
    # to call bedrock-mantle looks healthy until someone asks a question.
    try:
        probe_provider(settings)
    except MissingAwsCredentialsError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)
        ) from error
    return {"status": "ready", "provider": settings.llm_provider}


@app.post("/internal/v1/runs/stream", dependencies=[Depends(require_internal_token)])
async def stream_run(
    request: RunRequest,
    x_request_id: str = Header(default="unknown"),
    settings: Settings = Depends(get_settings),
) -> StreamingResponse:
    run_id = uuid4()
    provider = build_provider(settings)

    async def events() -> AsyncIterator[str]:
        content: list[str] = []
        yield StreamEvent(
            type="started", run_id=run_id, provider=provider.name, model=provider.model
        ).as_sse()
        try:
            async with asyncio.timeout(settings.run_timeout_seconds):
                async with aclosing(provider.stream(request.messages)) as stream:
                    async for delta in stream:
                        content.append(delta)
                        yield StreamEvent(type="token", run_id=run_id, delta=delta).as_sse()
            yield StreamEvent(
                type="completed",
                run_id=run_id,
                content="".join(content),
                provider=provider.name,
                model=provider.model,
            ).as_sse()
        except Exception as error:
            log.warning(
                "ai_run_failed",
                error_type=type(error).__name__,
                request_id=x_request_id,
                run_id=str(run_id),
                organization_id=str(request.organization_id),
            )
            yield StreamEvent(type="error", run_id=run_id, message="AI provider failed").as_sse()

    return StreamingResponse(events(), media_type="text/event-stream")
