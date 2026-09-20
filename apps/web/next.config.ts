import type { NextConfig } from "next";

/**
 * Para onde o servidor do Next encaminha as chamadas de API quando o navegador
 * as faz em caminho relativo. Nome de serviço do Compose por padrão, porque é
 * o que resolve dentro da rede dos contêineres.
 */
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://api:3001";

const config: NextConfig = {
  output: "standalone",
  /**
   * Publicar o app exige uma URL de API que o navegador de fora alcance, e o
   * `NEXT_PUBLIC_API_URL` é assado no build — o que obrigaria a reconstruir a
   * imagem a cada endereço novo, e ainda a liberar CORS entre dois domínios.
   *
   * Com `NEXT_PUBLIC_API_URL=""` o cliente passa a chamar caminho relativo, e
   * estes encaminhamentos levam a chamada até a API por dentro. Mesma origem:
   * um endereço público só, e CORS deixa de existir.
   *
   * Localmente nada muda: com `NEXT_PUBLIC_API_URL` apontando para
   * `http://localhost:3001`, o navegador nem chega aqui.
   */
  async rewrites() {
    return ["me", "auth", "organizations", "ai", "health"].map((prefixo) => ({
      source: `/${prefixo}/:path*`,
      destination: `${API_INTERNAL_URL}/${prefixo}/:path*`,
    }));
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
