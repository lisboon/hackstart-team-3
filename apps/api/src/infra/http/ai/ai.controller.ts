import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import { Readable } from "node:stream";
import { once } from "node:events";
import type { ReadableStream } from "node:stream/web";
import { randomUUID } from "node:crypto";
import { loadApplicationConfig } from "@/infra/config/application.config";
import { AuthGuard, AuthenticatedSession } from "../auth/auth-guard";
import { CurrentSession } from "../auth/current-session.decorator";
import { AiGateway } from "./ai.gateway";
import { StreamAiBodyDto } from "./dto/stream-ai.body.dto";
import { AuditService } from "./audit.service";
import {
  HttpErrorResponseDto,
  ValidationErrorResponseDto,
} from "../shared/errors/error.response.dto";

@ApiTags("AI")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: HttpErrorResponseDto })
@ApiUnprocessableEntityResponse({ type: ValidationErrorResponseDto })
@ApiTooManyRequestsResponse({ type: HttpErrorResponseDto })
@UseGuards(AuthGuard)
@Controller("ai/runs")
export class AiController {
  private readonly logger = new Logger(AiController.name);
  private readonly timeoutMs = loadApplicationConfig().ai.timeoutMs;

  constructor(
    private readonly gateway: AiGateway,
    private readonly audit: AuditService,
  ) {}

  @Post("stream")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Run the internal AI service and relay its SSE stream",
  })
  @ApiProduces("text/event-stream")
  @ApiOkResponse({
    description: "SSE stream emitting started, token and completed or error",
  })
  async stream(
    @Body() body: StreamAiBodyDto,
    @CurrentSession() session: AuthenticatedSession,
    @Res() res: Response,
  ): Promise<void> {
    const requestId = String(res.getHeader("x-request-id") ?? randomUUID());
    res.setHeader("x-request-id", requestId);
    const controller = new AbortController();
    let timedOut = false;
    let failureStatus = 503;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    const disconnect = () => controller.abort();
    res.on("close", disconnect);
    try {
      await this.audit.record({
        companyId: session.companyId,
        actorUserId: session.userId,
        action: "ai.run.requested",
        resourceType: "ai",
        requestId,
      });
      failureStatus = 502;
      const upstream = await this.gateway.stream(
        body,
        {
          userId: session.userId,
          organizationId: session.companyId,
          requestId,
        },
        controller.signal,
      );
      controller.signal.throwIfAborted();
      res.status(200);
      res.setHeader("content-type", "text/event-stream; charset=utf-8");
      res.setHeader("cache-control", "no-cache, no-transform");
      res.setHeader("x-accel-buffering", "no");
      res.flushHeaders();
      const source = Readable.fromWeb(
        upstream.body as ReadableStream<Uint8Array>,
        { signal: controller.signal },
      );
      for await (const chunk of source) {
        if (!res.write(chunk)) {
          await once(res, "drain", { signal: controller.signal });
        }
      }
      if (!res.destroyed) res.end();
    } catch {
      if (res.destroyed) return;
      const code = timedOut ? "ai_timeout" : "ai_unavailable";
      const message = timedOut
        ? "AI execution timed out"
        : "AI service unavailable";
      this.logger.warn({ message: "AI stream failed", requestId, code });
      if (!res.headersSent) {
        res
          .status(timedOut ? 504 : failureStatus)
          .json({ code, message, requestId });
      } else {
        res.end(
          `event: error\ndata: ${JSON.stringify({ type: "error", message })}\n\n`,
        );
      }
    } finally {
      clearTimeout(timeout);
      res.off("close", disconnect);
      controller.abort();
    }
  }
}
