// App shell service worker, written by hand. No next-pwa or serwist: the shell
// strategy fits in one file and CLAUDE.md forbids adding a dependency without a
// real consumer.
//
// Lives in public/ rather than in a route because a worker's scope is limited to
// the directory it is served from. At /sw.js the scope is "/", which is what the
// whole app needs.
//
// The privacy guarantee below is locked by tests/pwa.test.mjs, which runs this
// file's handlers against a stub scope. Change a strategy here and that test
// tells you whether you also changed what reaches the disk.

// Bump this em toda entrega que mude o que a pessoa ve: a lista de precache
// guarda o HTML de "/", e ele aponta para os arquivos daquele build. Sem o
// bump, um navegador que instalou a v1 continua servindo a aparencia da v1
// mesmo depois de tudo mudar no servidor — foi o que aconteceu entre a
// identidade nova e o painel do gestor.
//
// O activate apaga todo cache cuja chave nao seja a atual, entao subir o
// numero e o que limpa.
const VERSION = "v2";
const SHELL_CACHE = `colheita-verde-shell-${VERSION}`;
const OFFLINE_URL = "/offline";

// cache.addAll is atomic: a single 404 rejects the install and the worker never
// activates, which silently costs the app its whole offline mode. Only what the
// fallback chain cannot work without is required; icons are best effort.
const REQUIRED_URLS = ["/", OFFLINE_URL];
const OPTIONAL_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

// Nothing authenticated is ever written to CacheStorage. CacheStorage is disk
// that survives logout, and a factory-floor phone may be shared: declared mood
// and financial situation must not be left on it. This is the same reason the
// access token is kept in memory only.
//
// The API currently runs on another origin, so the cross-origin check below
// already skips it. These patterns are the guard that keeps holding if the API
// is ever proxied under the web origin.
const NEVER_CACHE_PATHS = [/^\/me\//, /^\/auth\//, /^\/ai\//];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(async (cache) => {
        await cache.addAll(REQUIRED_URLS);
        await Promise.allSettled(OPTIONAL_URLS.map((url) => cache.add(url)));
      })
      // skipWaiting trades a risk for a property that matters more here: a fix
      // pushed during the event reaches the installed app on the next load
      // instead of waiting for every tab to close. The risk is a page left open
      // across an update asking for a chunk the new build dropped, which Next
      // recovers from by reloading.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Returning without calling respondWith hands the request back to the
  // browser: the worker does not observe it and nothing is cached.
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE_PATHS.some((pattern) => pattern.test(url.pathname))) return;

  // App Router client-side navigations request RSC payloads. Serving those from
  // cache would mix stale trees into a fresh shell.
  if (url.searchParams.has("_rsc")) return;

  // Documents: network first, so signed-in content is never a stale shell, with
  // the cached page and then the offline screen as fallbacks.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(request)
          .then((cached) => cached ?? caches.match(OFFLINE_URL))
          .then((response) => response ?? Response.error()),
      ),
    );
    return;
  }

  // Everything else is build output: /_next/static/* filenames carry a content
  // hash and icons change rarely, so cache first is safe and fastest. The cache
  // only grows within a VERSION; activate clears it on the next bump.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
