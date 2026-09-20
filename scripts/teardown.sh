#!/usr/bin/env bash
#
# Apaga tudo que `deploy.sh` e a publicação da demonstração criaram na AWS.
#
#   ./scripts/teardown.sh          # lista o que seria apagado, e para
#   ./scripts/teardown.sh --apagar # apaga de verdade
#
# A conta é pessoal e a demonstração cobra por hora parada: uma task Fargate de
# 1 vCPU e o balanceador somam por volta de US$ 2,50 por dia sem ninguém usando.
# Rodar isto depois da apresentação é o que impede a conta de correr sozinha.
#
# A ordem importa e é a inversa da criação: quem aponta some antes de quem é
# apontado, senão a AWS recusa com DependencyViolation.
#
set -euo pipefail

CONTA="471730256212"
REGIAO="us-east-1"
CLUSTER="colheita"
SERVICO="colheita"
DISTRIBUICAO="E2WHZ1CDJ7LVTQ"
ALB="arn:aws:elasticloadbalancing:us-east-1:471730256212:loadbalancer/app/colheita-alb/433ed26821bec956"
GRUPO_ALVO="arn:aws:elasticloadbalancing:us-east-1:471730256212:targetgroup/colheita-tg/58998df538adb35f"
SG_ALB="sg-05457b3d9175e85ca"
SG_TASK="sg-00057b5684b3eddaf"
export AWS_PROFILE="${AWS_PROFILE:-hack2}"
export AWS_PAGER=""

AWS="$(command -v aws || echo "$HOME/AppData/Local/Programs/Amazon/AWSCLIV2/aws.exe")"

if [ "${1:-}" != "--apagar" ]; then
  cat <<AVISO
Isto apagaria, nesta ordem:

  1. distribuição CloudFront  $DISTRIBUICAO
  2. serviço ECS              $CLUSTER/$SERVICO  (e as tasks em execução)
  3. listener e balanceador   colheita-alb
  4. grupo de destino         colheita-tg
  5. grupos de segurança      $SG_ALB, $SG_TASK
  6. cluster ECS              $CLUSTER
  7. grupo de logs            /ecs/colheita
  8. repositórios ECR         colheita/{web,api,ai,db}  (com as imagens dentro)

O papel ecsTaskExecutionRole fica — é compartilhado e não custa nada.

Confirmado? Rode de novo com --apagar
AVISO
  exit 0
fi

# CloudFront não aceita apagar distribuição habilitada, e desabilitar leva uns
# 15 minutos para propagar. Começa por aqui para o resto correr em paralelo.
echo "== CloudFront: desabilitando $DISTRIBUICAO"
etag="$("$AWS" cloudfront get-distribution-config --id "$DISTRIBUICAO" --query ETag --output text)"
"$AWS" cloudfront get-distribution-config --id "$DISTRIBUICAO" --query DistributionConfig > /tmp/cf.json
sed -i 's/"Enabled": true/"Enabled": false/' /tmp/cf.json
"$AWS" cloudfront update-distribution --id "$DISTRIBUICAO" --if-match "$etag" \
  --distribution-config file:///tmp/cf.json --query "Distribution.Status" --output text
echo "   desabilitada. Apague depois de propagar:"
echo "   $AWS cloudfront delete-distribution --id $DISTRIBUICAO --if-match \$($AWS cloudfront get-distribution --id $DISTRIBUICAO --query ETag --output text)"

echo "== ECS: zerando e apagando o serviço"
"$AWS" ecs update-service --cluster "$CLUSTER" --service "$SERVICO" --desired-count 0 --query "service.desiredCount" --output text
"$AWS" ecs delete-service --cluster "$CLUSTER" --service "$SERVICO" --force --query "service.status" --output text

echo "== ELB: listener, balanceador, grupo de destino"
for l in $("$AWS" elbv2 describe-listeners --load-balancer-arn "$ALB" --query "Listeners[].ListenerArn" --output text); do
  "$AWS" elbv2 delete-listener --listener-arn "$l"
done
"$AWS" elbv2 delete-load-balancer --load-balancer-arn "$ALB"
# O grupo de destino só sai depois que o balanceador some de verdade.
for _ in $(seq 1 30); do
  "$AWS" elbv2 delete-target-group --target-group-arn "$GRUPO_ALVO" 2>/dev/null && break
  sleep 10
done

echo "== Grupos de segurança"
# O da task referencia o do ALB; a referência tem de cair antes dos dois.
"$AWS" ec2 revoke-security-group-ingress --group-id "$SG_TASK" \
  --protocol tcp --port 3000 --source-group "$SG_ALB" 2>/dev/null || true
for sg in "$SG_ALB" "$SG_TASK"; do
  for _ in $(seq 1 30); do
    "$AWS" ec2 delete-security-group --group-id "$sg" 2>/dev/null && break
    sleep 10
  done
done

echo "== Cluster e logs"
"$AWS" ecs delete-cluster --cluster "$CLUSTER" --query "cluster.status" --output text
"$AWS" logs delete-log-group --log-group-name /ecs/colheita 2>/dev/null || true

echo "== ECR"
for repo in web api ai db; do
  "$AWS" ecr delete-repository --repository-name "colheita/$repo" --force --query "repository.repositoryName" --output text 2>/dev/null || true
done

cat <<FIMDOTEXTO

Feito, menos a distribuição CloudFront — volte nela daqui a ~15 minutos com o
comando impresso acima.

Falta uma coisa que nenhum script faz por você: a chave de acesso raiz da conta
$CONTA foi colada em texto puro durante o hackathon. Apague no console, em
Security credentials > Access keys > Delete.
FIMDOTEXTO
