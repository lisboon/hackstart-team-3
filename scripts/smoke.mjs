import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const api = process.env.SMOKE_API_URL ?? "http://localhost:3001";
const web = process.env.SMOKE_WEB_URL ?? "http://localhost:3000";
async function ready(url) {
  for (let attempt = 0; attempt < 180; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) { await response.body?.cancel(); return; }
      await response.body?.cancel();
    } catch {}
    await delay(1000);
  }
  throw new Error(`Service did not become ready: ${url}`);
}
await Promise.all([ready(`${api}/health/ready`), ready(web)]);
const email = process.env.SEED_ADMIN_EMAIL ?? "admin@backend.com.br";
const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me-strong-password";

const login = await fetch(`${api}/auth/login`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
assert.equal(login.status, 201, "login");
const { accessToken } = await login.json();
assert.ok(accessToken);
const headers = { authorization: `Bearer ${accessToken}`, "content-type": "application/json" };
const organization = await fetch(`${api}/organizations/current`, { headers });
assert.equal(organization.status, 200, "current tenant");
assert.ok((await organization.json()).id);
const unauthorized = await fetch(`${api}/ai/runs/stream`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "smoke" }] }),
});
assert.equal(unauthorized.status, 401, "unauthenticated AI");
await unauthorized.body?.cancel();
const stream = await fetch(`${api}/ai/runs/stream`, {
  method: "POST", headers, signal: AbortSignal.timeout(65000),
  body: JSON.stringify({ messages: [{ role: "user", content: "smoke" }] }),
});
assert.equal(stream.status, 200, "AI stream");
const result = await stream.text();
assert.ok(result.includes("event: completed"), "completed event");
assert.ok(result.includes("Test response: smoke"), "deterministic provider");
assert.ok(!result.includes("event: error"), "no stream errors");
console.log("Smoke passed: web, readiness, login, tenant, auth guard, Core API → Python → SSE.");
