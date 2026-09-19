import { Injectable } from "@nestjs/common";
import { loadApplicationConfig } from "@/infra/config/application.config";
import { StreamAiBodyDto } from "./dto/stream-ai.body.dto";

export interface AiRunContext {
  userId: string;
  organizationId: string;
  requestId: string;
}

@Injectable()
export class AiGateway {
  private readonly config = loadApplicationConfig().ai;

  async stream(
    input: StreamAiBodyDto,
    context: AiRunContext,
    signal: AbortSignal,
  ): Promise<Response> {
    const response = await fetch(
      `${this.config.serviceUrl}/internal/v1/runs/stream`,
      {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          accept: "text/event-stream",
          "x-internal-token": this.config.internalToken,
          "x-request-id": context.requestId,
        },
        body: JSON.stringify({
          conversation_id: input.conversationId,
          organization_id: context.organizationId,
          user_id: context.userId,
          messages: input.messages,
        }),
      },
    );
    if (
      !response.ok ||
      !response.body ||
      response.headers.get("content-type")?.split(";")[0] !==
        "text/event-stream"
    ) {
      await response.body?.cancel();
      throw new Error(`Invalid AI response (status ${response.status})`);
    }
    return response;
  }
}
