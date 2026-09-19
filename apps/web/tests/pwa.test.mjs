import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import manifest from "../src/app/manifest.ts";

const require = createRequire(import.meta.url);
const ORIGIN = "https://colheita.example";

// Runs public/sw.js in a stub ServiceWorkerGlobalScope so the strategies can be
// asserted without a browser. What the worker writes to CacheStorage is a
// privacy boundary, not a performance detail, so it is worth pinning.
function loadServiceWorker({ network } = {}) {
  const source = readFileSync(
    require.resolve("../public/sw.js"),
    "utf8",
  );
  const listeners = new Map();
  const caches = new Map();
  const claimed = { skipWaiting: false, clients: false };

  function cacheFor(name) {
    if (!caches.has(name)) caches.set(name, new Map());
    return caches.get(name);
  }

  const fetchStub =
    network ?? (async () => new Response("body", { status: 200 }));

  // Response.type is a read-only getter in Node and defaults to "default". The
  // worker only caches "basic", which is what a same-origin response is in a
  // browser, so the stub has to say so for the strategies to be exercised.
  const networkFetch = async (request) => {
    const response = await fetchStub(request);
    return Object.defineProperties(response, {
      type: { value: "basic" },
      url: { value: request.url },
    });
  };

  const cacheApi = {
    open: async (name) => {
      const store = cacheFor(name);
      return {
        addAll: async (urls) => {
          for (const url of urls) {
            const response = await networkFetch({ url: ORIGIN + url });
            if (!response.ok) throw new Error(`precache failed: ${url}`);
            store.set(url, response);
          }
        },
        add: async (url) => {
          const response = await networkFetch({ url: ORIGIN + url });
          if (!response.ok) throw new Error(`precache failed: ${url}`);
          store.set(url, response);
        },
        put: async (request, response) => {
          store.set(new URL(request.url).pathname, response);
        },
      };
    },
    keys: async () => [...caches.keys()],
    delete: async (name) => caches.delete(name),
    match: async (target) => {
      const path =
        typeof target === "string" ? target : new URL(target.url).pathname;
      for (const store of caches.values()) {
        if (store.has(path)) return store.get(path);
      }
      return undefined;
    },
  };

  const scope = {
    self: {
      addEventListener: (type, handler) => listeners.set(type, handler),
      skipWaiting: () => {
        claimed.skipWaiting = true;
      },
      clients: {
        claim: () => {
          claimed.clients = true;
        },
      },
      location: { origin: ORIGIN },
    },
    caches: cacheApi,
    fetch: networkFetch,
    URL,
    Response,
    Promise,
    console,
  };

  vm.runInNewContext(source, scope);

  return {
    caches,
    claimed,
    cachedPaths: () => [...caches.values()].flatMap((store) => [...store.keys()]),
    async install() {
      const waits = [];
      await listeners.get("install")({ waitUntil: (p) => waits.push(p) });
      await Promise.all(waits);
    },
    async activate() {
      const waits = [];
      await listeners.get("activate")({ waitUntil: (p) => waits.push(p) });
      await Promise.all(waits);
    },
    // Returns the response the worker served, or null when it declined to
    // handle the request and left it to the browser.
    async handle({ url, method = "GET", mode = "no-cors" }) {
      let responded = null;
      listeners.get("fetch")({
        request: { url, method, mode },
        respondWith: (promise) => {
          responded = promise;
        },
      });
      if (responded === null) return null;
      const response = await responded;
      // Let the fire-and-forget cache.put inside the handler settle.
      await new Promise((resolve) => setImmediate(resolve));
      return response;
    },
  };
}

test("manifest satisfies the Android install requirements", () => {
  const result = manifest();
  assert.equal(result.name, "Colheita");
  assert.equal(result.display, "standalone");
  assert.equal(result.start_url, "/");
  assert.equal(result.scope, "/");

  const sizes = (purpose) =>
    result.icons
      .filter((icon) => icon.purpose === purpose)
      .map((icon) => icon.sizes);

  assert.deepEqual(sizes("any").sort(), ["192x192", "512x512"]);
  // Android crops icons; without a maskable variant the artwork is cut.
  assert.deepEqual(sizes("maskable"), ["512x512"]);
});

test("install precaches the offline screen and survives a missing icon", async () => {
  const worker = loadServiceWorker({
    network: async ({ url }) => {
      if (url.includes("/auth/login")) {
        return new Response(
          JSON.stringify({
            accessToken: "session",
            user: { id: "1", name: "Test User", email: "test@test.com", role: "USER" },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      return url.includes("/icons/")
        ? new Response("missing", { status: 404 })
        : new Response("body", { status: 200 });
    },
  });

  await worker.install();

  // Icons are best effort, so a 404 there must not abort the install: an
  // aborted install means the worker never activates and offline mode is gone.
  assert.ok(worker.cachedPaths().includes("/offline"));
  assert.ok(worker.claimed.skipWaiting);
});

test("authenticated paths never reach CacheStorage", async () => {
  const worker = loadServiceWorker();
  await worker.install();

  for (const path of [
    "/me/summary",
    "/me/today",
    "/auth/login",
    "/ai/runs/stream",
  ]) {
    assert.equal(
      await worker.handle({ url: `${ORIGIN}${path}` }),
      null,
      `${path} must be left to the browser`,
    );
  }

  // Cross-origin (the API today) and non-GET are also left alone.
  assert.equal(await worker.handle({ url: "https://api.example/me/summary" }), null);
  assert.equal(
    await worker.handle({ url: `${ORIGIN}/me/self-report`, method: "POST" }),
    null,
  );
  // RSC payloads would mix a stale tree into a fresh shell.
  assert.equal(await worker.handle({ url: `${ORIGIN}/?_rsc=abc` }), null);

  assert.deepEqual(
    worker.cachedPaths().filter((path) => /^\/(me|auth|ai)\//.test(path)),
    [],
  );
});

test("build output is cached, then served without the network", async () => {
  let calls = 0;
  const worker = loadServiceWorker({
    network: async () => {
      calls += 1;
      return new Response("chunk", { status: 200 });
    },
  });
  await worker.install();

  const asset = `${ORIGIN}/_next/static/chunks/main.js`;
  const callsAfterInstall = calls;

  assert.ok(await worker.handle({ url: asset }));
  assert.equal(calls, callsAfterInstall + 1);
  assert.ok(worker.cachedPaths().includes("/_next/static/chunks/main.js"));

  // Second hit is cache first: no new network call.
  assert.ok(await worker.handle({ url: asset }));
  assert.equal(calls, callsAfterInstall + 1);
});

test("a failed navigation falls back to the offline screen", async () => {
  let offline = false;
  const worker = loadServiceWorker({
    network: async ({ url }) => {
      if (offline) throw new Error("no network");
      return new Response(`page ${url}`, { status: 200 });
    },
  });
  await worker.install();

  offline = true;
  const response = await worker.handle({
    url: `${ORIGIN}/nunca-visitada`,
    mode: "navigate",
  });

  assert.ok(response);
  assert.match(await response.text(), /body|offline/);
});

test("activate drops caches from older versions", async () => {
  const worker = loadServiceWorker();
  await worker.install();
  worker.caches.set("colheita-verde-shell-v0", new Map([["/", "stale"]]));

  await worker.activate();

  assert.deepEqual([...worker.caches.keys()], ["colheita-verde-shell-v1"]);
  assert.ok(worker.claimed.clients);
});
