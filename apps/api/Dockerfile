FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    HUSKY=0

RUN npm install -g pnpm@11.1.1 \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --filter hackathon-star-nest... --frozen-lockfile

FROM dependencies AS builder
COPY apps/api/ ./apps/api/

RUN pnpm --dir apps/api prisma:generate \
  && pnpm --dir apps/api build

# Deriva do builder, e não de dependencies, porque `prisma db seed` importa
# `../generated/prisma/client` — que só existe depois do prisma:generate. Sem
# isso a imagem aplica migrations e falha na semente, que é justamente o que
# povoa o catálogo do COOPS e a coorte da demonstração.
FROM builder AS migrator

ENV NODE_ENV=production

WORKDIR /app/apps/api

USER node

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production \
    PORT=3001

USER node
WORKDIR /app/apps/api

COPY --from=builder --chown=node:node /app/node_modules/ /app/node_modules/
COPY --from=builder --chown=node:node /app/apps/api/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /app/apps/api/package.json ./
COPY --from=builder --chown=node:node /app/apps/api/generated/ ./generated/
COPY --from=builder --chown=node:node /app/apps/api/dist/ ./dist/

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health/ready').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/infra/http/main.js"]
