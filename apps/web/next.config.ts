import type { NextConfig } from "next";

/**
 * Para onde `/api/*` é encaminhado. Lido no build e serializado em
 * `.next/routes-manifest.json`, por isso é argumento de build da imagem e não
 * variável de runtime.
 *
 * Em AWS os três containers dividem um namespace de rede, então `localhost` é
 * constante: a Core API responde na 3001 e a porta nunca entra em security
 * group nenhum. Localmente o valor é o mesmo, e o Compose continua chamando a
 * API direto por `NEXT_PUBLIC_API_URL=http://localhost:3001` — quem passa por
 * este caminho é só a imagem de produção, onde `NEXT_PUBLIC_API_URL=/api`.
 */
const apiUrl = process.env.API_URL || "http://localhost:3001";

const config: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
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
