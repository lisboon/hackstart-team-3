# infra

Terraform do ambiente AWS: um serviço ECS Fargate rodando `web`, `api` e `ai`
como três containers de uma única task, atrás de um ALB, com CloudFront na
frente para ter HTTPS, falando com um RDS Postgres.

```
Internet -> CloudFront :443 -> ALB :80 -> task:3000
                                          |- web  :3000  Next.js standalone
                                          |- api  :3001  NestJS   (localhost)
                                          '- ai   :8000  FastAPI  (localhost)
                                                |
                                          RDS Postgres 17 (subnets privadas)
```

Os três containers dividem um namespace de rede, então se alcançam por
`localhost`. **As portas 3001 e 8000 não estão em security group nenhum** — são
simplesmente inalcançáveis de fora da task.

## Por que o navegador não fala direto com a Core API

`apps/web` é construído com `NEXT_PUBLIC_API_URL=/api`, e `next.config.ts`
reescreve `/api/*` para a Core API no `localhost` da task. Isso resolve quatro
coisas de uma vez:

- **Rota.** As rotas da Core API são de raiz (`/auth`, `/users`, `/organizations`,
  `/me`, `/ai/runs`, `/health`) e colidiriam com as do app (`/trilha`, `/perfil`,
  `/manager`) num roteamento por path no ALB. `/` é reivindicado pelos dois.
- **CORS.** Mesma origem, então não existe requisição cross-origin para liberar.
- **Conteúdo misto.** Uma página em HTTPS não pode chamar uma API em HTTP. Com
  dois endereços, seria preciso certificado nos dois.
- **Superfície.** A Core API e o serviço de IA não ficam expostos à internet.

O preço é que a Core API vê todo mundo chegando de `127.0.0.1`. O throttler do
Nest usa `req.ip`, então a plateia inteira divide um balde só — daí
`THROTTLE_LIMIT` em 600 em vez dos 30 do padrão.

## HTTPS não é enfeite aqui

`enable_cloudfront` começa ligado, ao contrário do que seria numa API qualquer.
`apps/web` é um PWA: `navigator.serviceWorker` **não existe** fora de contexto
seguro. Sobre HTTP puro o app abre e funciona, mas sem service worker — isto é,
sem instalação na tela inicial e sem a tela offline. O CloudFront traz
certificado em `*.cloudfront.net` sem domínio e sem trabalho de DNS.

| Modo | Variáveis | URL |
|---|---|---|
| 1. CloudFront (padrão) | defaults | `https://<id>.cloudfront.net` |
| 2. Domínio próprio | `domain_name = "..."` | `https://<domínio>` |
| 3. HTTP puro | `enable_cloudfront = false` | `http://<alb>.elb.amazonaws.com` |

O modo 2 vence o 1. Trocar de modo muda `CORS_ORIGINS`, o que significa nova
revisão de task definition: depois do apply, rode o workflow de deploy ou
`aws ecs update-service --cluster colheita --service colheita-app --force-new-deployment`.

## Passos manuais, uma vez só

| # | Passo |
|---|---|
| 1 | Uma identidade IAM com `AdministratorAccess` e `aws configure`. **Não uma access key de root** — root ignora toda policy e não pode ser escopado |
| 2 | Criar o bucket de state `colheita-tfstate-<conta>`: versionamento ligado, bloqueio de acesso público ligado, SSE-S3 |
| 3 | Console do Bedrock -> Model access. Confirmar que o modelo responde em `/chat/completions`, não só no `InvokeModel` (ver abaixo) |
| 4 | Depois do primeiro apply: definir o segredo `AWS_DEPLOY_ROLE_ARN` (= `terraform output deploy_role_arn`) e a variável `APP_URL` (= `terraform output app_url`, com esquema) no GitHub |
| 5 | Um AWS Budget com alerta por e-mail. É a proteção contra um loop caro rodando de madrugada |

## Primeiro apply

```bash
cp backend.hcl.example      backend.hcl        # aponte para o seu bucket
cp terraform.tfvars.example terraform.tfvars   # repo, senhas da demo, modelo

terraform init -backend-config=backend.hcl

# ECR primeiro. Os repositórios são IMMUTABLE e a task definition aponta para uma
# tag, então aplicar tudo de uma vez cria um serviço que nunca consegue baixar
# imagem e tenta de novo para sempre, afogando todo erro posterior.
terraform apply -target=aws_ecr_repository.app

# Constrói e empurra as quatro com os contextos e build args certos.
bash push-images.sh

TAG=$(git rev-parse HEAD)
terraform apply -var="image_tag=$TAG"

# Migrations e semente, como task própria.
eval "$(terraform output -raw run_migrations_command)"
aws ecs update-service --cluster colheita --service colheita-app --force-new-deployment
```

A saída de `terraform output app_url` é o endereço da apresentação. As credenciais
são `seed_admin_email`/`seed_admin_password` para o gestor e
`seed_worker_email`/`seed_worker_password` para a pessoa do pitch.

## O que a semente deixa pronto

`seed_demo_data` está ligado, e não é detalhe: a semente grava as 30 peças do
COOPS, seis pessoas com histórico na unidade do pitch e quatro na unidade
vizinha. Sem ela o painel do gestor abre vazio, e a supressão abaixo de cinco
pessoas — que é uma das regras que o produto precisa demonstrar — não tem o que
suprimir. Ela é idempotente, então roda em todo deploy sem duplicar nada.

Os dados são fictícios por construção: os e-mails usam `demo.invalid`, domínio
reservado pela RFC 2606, e essas pessoas não têm senha utilizável.

## A janela da jornada fica aberta de propósito

O padrão do código é segunda a sexta, 07:30 às 18:00 no fuso da unidade, e é a
regra de verdade. Aqui as variáveis `journey_window_*` abrem os sete dias, de
00:00 a 23:59, porque a apresentação é num domingo e o horário dela não está no
nosso controle. Com o padrão, a diária apareceria fechada no palco —
comportamento certo, demonstração errada.

Empresa recém-semeada não tem faixa cadastrada, então quem vale é este fallback.
Para ver a regra fechando, aplique com `journey_window_days = "1,2,3,4,5"`.

## Dia a dia

Push em `main` dispara `.github/workflows/deploy.yml`: constrói e empurra as
quatro imagens, roda migrations e semente como task avulsa, registra nova revisão
de task definition, rola o serviço e faz smoke.

**O serviço ignora mudanças de `task_definition` vindas do Terraform.** Sem isso,
todo apply devolveria produção à imagem de bootstrap. Então quando você mexe em
variável de ambiente, CPU ou segredo aqui, o `terraform apply` registra a revisão
mas **não** move o serviço para ela — rode o workflow depois (ou
`aws ecs update-service --cluster colheita --service colheita-app --task-definition colheita-app`).

## Depurar

```bash
aws logs tail /ecs/colheita/app --follow --format short
aws logs tail /ecs/colheita/app --follow --log-stream-name-prefix app/ai
aws logs tail /ecs/colheita/migrate --follow

aws ecs describe-services --cluster colheita --services colheita-app \
  --query 'services[0].events[0:15].[createdAt,message]' --output table

aws ecs execute-command --cluster colheita --container api --interactive --command /bin/sh \
  --task $(aws ecs list-tasks --cluster colheita --service-name colheita-app --query 'taskArns[0]' --output text)
```

| Sintoma | Causa |
|---|---|
| `ResourceInitializationError: unable to pull secrets or registry auth` | Execution role sem `ssm:GetParameters`, ou ARN de SSM errado no `valueFrom` |
| `CannotPullContainerError ... manifest unknown` | A tag não existe — é a ordem "ECR primeiro" acima |
| api sai com 1 e o log fala de `DATABASE_URL` | Configuração reprovada no boot: `loadApplicationConfig` lista o que está errado antes de subir |
| api sai com 1 sem mensagem de config | Postgres inalcançável: `sslmode` errado, ou o security group do banco não libera o grupo da task |
| `/api/health/ready` devolve HTML de 404 | O rewrite não entrou no `routes-manifest.json` — a imagem do web foi construída sem `API_URL` |
| Target group insalubre com o log do web limpo | Health check apontando para rota que redireciona; tem de ser `/`, que responde 200 |
| `503` em `/health/ready` do container `ai` | Sem credencial para assinar o token do Bedrock: task role sem `bedrock-mantle:*` |
| Todo pedido de IA volta `AI provider failed` | Id de modelo, ou model access não concedido, ou cota diária de token estourada. Os três dão a mesma mensagem — o log do container `ai` traz o `error_type` |

O id do modelo é o erro mais comum. Os ids do `bedrock-mantle` não levam o
prefixo de inference profile (`us.`) nem o sufixo de versão (`:0`):
`openai.gpt-oss-120b-1:0` é 404 ali. Liste o que a conta alcança de fato:

```bash
curl https://bedrock-mantle.us-east-1.api.aws/v1/models \
  -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK"
```

## Custo

Ordem de grandeza em us-east-1, sob demanda, para um dia de hackathon. Confira o
valor corrente na [calculadora da AWS](https://calculator.aws/) — preço muda e
esta tabela envelhece.

| Item | Por dia |
|---|---|
| Fargate, 1 vCPU + 2 GB, uma task | ~US$ 1,20 |
| Application Load Balancer | ~US$ 0,55 + LCU |
| RDS db.t4g.micro + 20 GB gp3 | ~US$ 0,46 |
| CloudFront, ECR, Parameter Store | centavos |
| **Total** | **~US$ 2,30 por dia** |

Não há NAT gateway, que sozinho custaria mais que todo o resto: a task roda em
subnet pública com IP próprio, e quem a mantém privada é o security group.

O Bedrock é cobrado por token, à parte. Uma demonstração com algumas dezenas de
respostas fica em centavos; veja o preço do modelo em
[Amazon Bedrock pricing](https://aws.amazon.com/bedrock/pricing/).

**Depois da entrega, derrube tudo.** O ALB e o RDS cobram por hora existindo,
tenha tráfego ou não:

```bash
terraform destroy
```

## Lacunas conhecidas

- `.github/workflows/ci.yml` não constrói a imagem do web, então um
  `apps/web/Dockerfile` quebrado chega verde na `main` e só falha no deploy.
- Nenhum container declara `healthCheck` na task definition, e é decisão: com
  `essential = true` nos três, um health check da IA reprovando derrubaria a task
  inteira. O app funciona sem IA — login, trilha, metas e painel não dependem
  dela. O portão do deploy é o health check do ALB sobre o web.
- `desired_count` é 1. Não há redundância de zona: a task vive numa AZ por vez.
  Para uma demonstração de um dia isso é escolha de custo, não descuido.
- O state guarda a senha do RDS em texto claro. O bucket tem de ter bloqueio de
  acesso público ligado.
