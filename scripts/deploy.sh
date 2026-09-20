#!/usr/bin/env bash
#
# Publica a demonstração na AWS. Um comando por serviço, e nenhum estado
# guardado aqui — tudo que ele precisa saber está em variáveis no topo.
#
#   ./scripts/deploy.sh web      # o caso comum: mudou tela, sobe tela
#   ./scripts/deploy.sh api
#   ./scripts/deploy.sh db       # regrava o banco com o estado local de hoje
#   ./scripts/deploy.sh all
#
# Exige `aws` configurado e Docker rodando. O perfil vem de AWS_PROFILE, ou
# `hack2` por padrão:
#
#   AWS_PROFILE=meu-perfil ./scripts/deploy.sh web
#
set -euo pipefail

CONTA="471730256212"
REGIAO="us-east-1"
REGISTRO="$CONTA.dkr.ecr.$REGIAO.amazonaws.com"
CLUSTER="colheita"
SERVICO="colheita"
export AWS_PROFILE="${AWS_PROFILE:-hack2}"
export AWS_PAGER=""

# O Windows instala a CLI fora do PATH do Git Bash com frequência.
AWS="$(command -v aws || echo "$HOME/AppData/Local/Programs/Amazon/AWSCLIV2/aws.exe")"

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$raiz"

entrar() {
  "$AWS" ecr get-login-password --region "$REGIAO" \
    | docker login --username AWS --password-stdin "$REGISTRO" >/dev/null
}

# A URL da API é **assada no build** do Next (`output: standalone` congela
# inclusive os rewrites), então os dois argumentos abaixo não podem virar
# variável de ambiente da task: teriam de ser passados aqui, ou não valem.
#
# `NEXT_PUBLIC_API_URL` vazio faz o navegador chamar caminho relativo;
# `API_INTERNAL_URL` é para onde o servidor do Next encaminha. Numa task ECS
# com `awsvpc` os contêineres dividem a pilha de rede, por isso `localhost`.
construir_web() {
  docker build -f apps/web/Dockerfile \
    --build-arg NEXT_PUBLIC_API_URL="" \
    --build-arg API_INTERNAL_URL="http://localhost:3001" \
    -t "$REGISTRO/colheita/web:latest" .
  docker push "$REGISTRO/colheita/web:latest"
}

# `--target runner` e não a imagem de desenvolvimento: 436MB contra 1,26GB, e
# sem o Prisma CLI, que não faz falta porque o banco já sobe semeado.
construir_api() {
  docker build -f apps/api/Dockerfile --target runner \
    -t "$REGISTRO/colheita/api:slim" .
  docker push "$REGISTRO/colheita/api:slim"
}

# Leva o banco local, com a demonstração dentro, em vez de migrar e semear no
# arranque. O estado publicado passa a ser o que foi conferido em casa — e o
# contêiner da API perde um ponto de falha na frente da banca.
construir_db() {
  local tmp
  tmp="$(mktemp -d)"
  docker compose exec -T backend-db pg_dump -U backend -d backend_db --clean --if-exists > "$tmp/dump.sql"
  printf 'FROM postgres:16-alpine\nCOPY dump.sql /docker-entrypoint-initdb.d/10-colheita.sql\n' > "$tmp/Dockerfile"
  docker build -t "$REGISTRO/colheita/db:latest" "$tmp"
  docker push "$REGISTRO/colheita/db:latest"
  rm -rf "$tmp"
}

# Sem isto o ECS continua servindo a imagem antiga: a tag `latest` mudou, mas a
# task em execução não sabe disso.
reiniciar() {
  "$AWS" ecs update-service --cluster "$CLUSTER" --service "$SERVICO" \
    --force-new-deployment --query "service.serviceName" --output text
  echo "Deploy disparado. Acompanhe:"
  echo "  $AWS ecs describe-services --cluster $CLUSTER --services $SERVICO --query 'services[0].deployments[].{Rev:taskDefinition,Estado:rolloutState}' --output text"
}

alvo="${1:-}"
case "$alvo" in
  web) entrar; construir_web; reiniciar ;;
  api) entrar; construir_api; reiniciar ;;
  db)  entrar; construir_db;  reiniciar ;;
  all) entrar; construir_db; construir_api; construir_web; reiniciar ;;
  *)   echo "uso: $0 {web|api|db|all}" >&2; exit 1 ;;
esac
