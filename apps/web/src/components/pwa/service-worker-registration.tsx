"use client";

import { useEffect } from "react";

// Registers the app shell worker. Renders nothing: it exists so the root layout
// stays a server component.
//
// Not in components/ui or components/form on purpose. Those two directories are
// forbidden from reaching into app concerns by eslint.config.mjs and
// tests/boundaries.test.mjs. components/pwa is a context directory, like
// components/auth and components/ai.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Development only runs without the worker. The dev server rebuilds chunks
    // on every edit while the fetch handler is cache first for /_next/static,
    // which would serve stale bundles and look like a broken app. To exercise
    // the worker locally, run a production build: pnpm build && pnpm start.
    if (process.env.NODE_ENV !== "production") return;

    // Waiting for load keeps the registration off the critical path of the
    // first paint.
    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
