FROM node:24-alpine AS base

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1

RUN npm install -g pnpm@11.1.1

WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --filter @hackathon-star/web... --frozen-lockfile

FROM dependencies AS builder
COPY apps/web/ ./apps/web/

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Para onde os `rewrites` de next.config.ts encaminham a API. Precisa ser
# argumento de build, e nao variavel de ambiente: com `output: standalone` o
# Next congela os rewrites no build, e um valor passado so em tempo de execucao
# nao tem efeito nenhum — a chamada continua indo para o destino compilado.
#
# Nome de servico do Compose por padrao. Num orquestrador em que os conteineres
# dividem a pilha de rede (ECS com awsvpc, por exemplo), passe localhost.
ARG API_INTERNAL_URL=http://api:3001
ENV API_INTERNAL_URL=${API_INTERNAL_URL}

RUN pnpm --dir apps/web build

FROM node:24-alpine AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

USER node
WORKDIR /app

# O standalone do Next resolve o workspace: o servidor sai sob apps/web e as
# dependências ficam na raiz copiada, por isso os destinos não são simétricos.
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone/ ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static/ ./apps/web/.next/static/
COPY --from=builder --chown=node:node /app/apps/web/public/ ./apps/web/public/

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
