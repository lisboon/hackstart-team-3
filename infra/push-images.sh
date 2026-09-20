#!/usr/bin/env bash
# Constrói e empurra as quatro imagens de uma estação de trabalho. O CI faz o
# mesmo em .github/workflows/deploy.yml; isto existe para o primeiro deploy,
# antes de a role OIDC do GitHub sequer existir.
set -euo pipefail

export PATH="$PATH:/c/Program Files/Amazon/AWSCLIV2"

REGION="${AWS_REGION:-us-east-1}"
PROJECT="${PROJECT:-colheita}"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAG="${1:-$(git -C "$ROOT" rev-parse HEAD)}"

echo "registry: $REGISTRY"
echo "tag     : $TAG"

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

# web sai da raiz do repositório: o Dockerfile instala pelo workspace do pnpm.
# NEXT_PUBLIC_API_URL é o que o navegador usa — `/api`, mesma origem, sem CORS e
# sem expor a 3001. API_URL é o destino do rewrite, resolvido pelo servidor Next
# dentro da task, onde os containers dividem o localhost.
docker buildx build --platform linux/amd64 --push \
  -f "$ROOT/apps/web/Dockerfile" \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  --build-arg API_URL=http://localhost:3001 \
  -t "$REGISTRY/$PROJECT-web:$TAG" "$ROOT"

# api e migrate saem do mesmo Dockerfile, em stages diferentes. O contexto é a
# raiz porque o stage de dependências copia pnpm-workspace.yaml e o lockfile.
docker buildx build --platform linux/amd64 --push \
  -f "$ROOT/apps/api/Dockerfile" --target runner \
  -t "$REGISTRY/$PROJECT-api:$TAG" "$ROOT"

docker buildx build --platform linux/amd64 --push \
  -f "$ROOT/apps/api/Dockerfile" --target migrator \
  -t "$REGISTRY/$PROJECT-migrate:$TAG" "$ROOT"

docker buildx build --platform linux/amd64 --push \
  -f "$ROOT/apps/ai/Dockerfile" -t "$REGISTRY/$PROJECT-ai:$TAG" "$ROOT/apps/ai"

echo
echo "pushed $TAG"
echo "terraform apply -var=\"image_tag=$TAG\""
