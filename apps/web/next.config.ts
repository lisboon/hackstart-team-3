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
  /**
   * O middleware de compressão do Next enfileira o corpo da resposta, e isso
   * inclui o que passa pelo rewrite abaixo. Medido com uma origem que emite um
   * quadro SSE a cada 500ms: ligado, os cinco chegam juntos no fim; desligado,
   * chegam espaçados como saíram. Enfileirado, a resposta da IA só apareceria
   * quando o modelo terminasse — até 50 segundos de tela parada, e o contrato
   * `started -> token* -> completed` perderia o sentido.
   *
   * O que se perde em gzip de HTML e JS volta na borda: a distribuição comprime
   * e cacheia `/_next/static/*` num comportamento próprio, onde não há stream.
   */
  compress: false,
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
