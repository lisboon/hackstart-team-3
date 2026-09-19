import assert from "node:assert/strict";
import test from "node:test";
import { HttpError, request, requestJson } from "../src/lib/http/client.ts";

test("JSON transport forwards AbortSignal", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    return Response.json({ ok: true });
  });
  assert.deepEqual(await requestJson("/test", { signal: controller.signal }), {
    ok: true,
  });
});
test("HTTP errors preserve status without exposing response content", async (t) => {
  for (const status of [401, 403, 409, 422, 429, 503]) {
    t.mock.method(
      globalThis,
      "fetch",
      async () => new Response("private upstream data", { status }),
    );
    await assert.rejects(
      request("/test", {}),
      (error) =>
        error instanceof HttpError &&
        error.status === status &&
        !error.message.includes("private"),
    );
  }
});
test("invalid JSON and empty body produce safe errors", async (t) => {
  for (const response of [
    new Response("private"),
    new Response(null, { status: 204 }),
  ]) {
    t.mock.method(globalThis, "fetch", async () => response);
    await assert.rejects(requestJson("/test", {}), /resposta inválida/);
  }
});
test("network error is sanitized", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("secret address");
  });
  await assert.rejects(request("/test", {}), /conectar ao serviço/);
});
test("abort preserves cancellation", async (t) => {
  const controller = new AbortController();
  controller.abort();
  const cause = new DOMException("Aborted", "AbortError");
  t.mock.method(globalThis, "fetch", async () => {
    throw cause;
  });
  await assert.rejects(
    request("/test", { signal: controller.signal }),
    (error) => error === cause,
  );
});
