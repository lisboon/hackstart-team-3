import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
} from "node:http";
import { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { loadApplicationConfig } from "@/infra/config/application.config";
import { configureApp } from "../app.setup";
import { AuthGuard } from "../auth/auth-guard";
import { AiController } from "./ai.controller";
import { AiGateway } from "./ai.gateway";
import { AuditService } from "./audit.service";

jest.mock("./audit.service", () => ({ AuditService: class {} }));
jest.mock("@/infra/config/application.config", () => ({
  loadApplicationConfig: jest.fn(),
}));

describe("AI HTTP streaming", () => {
  let app: INestApplication;
  let upstream: Server;
  let handler: (req: IncomingMessage, res: ServerResponse) => void;
  let url: string;
  const audit = { record: jest.fn() };
  const session = {
    userId: randomUUID(),
    companyId: randomUUID(),
    role: "ADMIN",
  };
  const body = { messages: [{ role: "user", content: "hello" }] };
  const completed =
    'event: completed\ndata: {"type":"completed","content":"hello"}\n\n';

  beforeAll(async () => {
    upstream = createServer((req, res) => handler(req, res));
    await new Promise<void>((resolve) =>
      upstream.listen(0, "127.0.0.1", resolve),
    );
    (loadApplicationConfig as jest.Mock).mockReturnValue({
      ai: {
        serviceUrl: `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`,
        internalToken: "internal-test-token",
        timeoutMs: 250,
      },
    });
    const module = await Test.createTestingModule({
      controllers: [AiController],
      providers: [AiGateway, { provide: AuditService, useValue: audit }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest();
          if (!req.headers.authorization) throw new UnauthorizedException();
          req.user = session;
          return true;
        },
      })
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.listen(0, "127.0.0.1");
    url = await app.getUrl();
  });

  beforeEach(() => {
    audit.record.mockReset().mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
    upstream.closeAllConnections();
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
  });

  function run() {
    return request(app.getHttpServer())
      .post("/ai/runs/stream")
      .set("Authorization", "Bearer test")
      .send(body);
  }

  it("forwards only the authenticated tenant and relays SSE", async () => {
    let received: Record<string, unknown> | undefined;
    handler = (req, res) => {
      expect(req.headers["x-internal-token"]).toBe("internal-test-token");
      let data = "";
      req.on("data", (chunk) => {
        data += String(chunk);
      });
      req.on("end", () => {
        received = JSON.parse(data);
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.end(completed);
      });
    };
    const result = await run().expect(200);
    expect(result.text).toBe(completed);
    expect(received).toMatchObject({
      user_id: session.userId,
      organization_id: session.companyId,
      messages: body.messages,
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: session.companyId,
        actorUserId: session.userId,
        action: "ai.run.requested",
      }),
    );
  });

  it("rejects unauthenticated requests and tenant injection", async () => {
    await request(app.getHttpServer())
      .post("/ai/runs/stream")
      .send(body)
      .expect(401);
    await request(app.getHttpServer())
      .post("/ai/runs/stream")
      .set("Authorization", "Bearer test")
      .send({ ...body, companyId: randomUUID() })
      .expect(422);
    expect(audit.record).not.toHaveBeenCalled();
  });

  it("does not invoke AI when audit persistence fails", async () => {
    const called = jest.fn();
    handler = called;
    audit.record.mockRejectedValueOnce(new Error("database unavailable"));
    await run().expect(503);
    expect(called).not.toHaveBeenCalled();
  });

  it.each([500, 200])(
    "rejects a non-SSE upstream response with status %s",
    async (status) => {
      handler = (_req, res) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end('{"secret":"private-detail"}');
      };
      const result = await run().expect(502);
      expect(JSON.stringify(result.body)).not.toContain("private-detail");
    },
  );

  it("times out before upstream headers", async () => {
    handler = (req) => {
      req.resume();
    };
    const result = await run().expect(504);
    expect(result.body.code).toBe("ai_timeout");
  });

  it("keeps the deadline active after receiving upstream headers", async () => {
    handler = (req, res) => {
      req.resume();
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write('event: started\ndata: {"type":"started"}\n\n');
    };
    const result = await run().expect(200);
    expect(result.text).toContain("event: started");
    expect(result.text).toContain("AI execution timed out");
    expect(result.text).not.toContain("event: completed");
  });

  it("reports an error when upstream disconnects during streaming", async () => {
    handler = (req, res) => {
      req.resume();
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write('event: token\ndata: {"type":"token","delta":"partial"}\n\n');
      setTimeout(() => res.destroy(), 20);
    };
    const result = await run().expect(200);
    expect(result.text).toContain("event: error");
  });

  it("cancels the upstream when the browser disconnects", async () => {
    let closed!: () => void;
    const upstreamClosed = new Promise<void>((resolve) => {
      closed = resolve;
    });
    handler = (req, res) => {
      req.resume();
      res.on("close", closed);
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write('event: started\ndata: {"type":"started"}\n\n');
    };
    const controller = new AbortController();
    const result = await fetch(`${url}/ai/runs/stream`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: "Bearer test",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const reader = result.body!.getReader();
    await reader.read();
    controller.abort();
    await reader.cancel().catch(() => undefined);
    await upstreamClosed;
  });
});
