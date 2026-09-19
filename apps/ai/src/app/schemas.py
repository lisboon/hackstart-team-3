from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=50_000)


class RunRequest(BaseModel):
    conversation_id: UUID | None = None
    organization_id: UUID
    user_id: UUID
    messages: list[Message] = Field(min_length=1, max_length=100)


class StreamEvent(BaseModel):
    type: Literal[
        "started",
        "token",
        "completed",
        "error",
    ]
    run_id: UUID
    delta: str | None = None
    content: str | None = None
    message: str | None = None
    provider: str | None = None
    model: str | None = None

    def as_sse(self) -> str:
        payload = self.model_dump_json(exclude_none=True)
        return f"event: {self.type}\ndata: {payload}\n\n"
