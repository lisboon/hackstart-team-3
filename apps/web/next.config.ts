import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // Without no-store the browser caches the worker itself and the app
        // stays pinned to an old version. It is the PWA bug that shows up on
        // demo day.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};
export default config;
