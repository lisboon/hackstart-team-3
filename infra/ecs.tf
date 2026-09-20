resource "aws_ecs_cluster" "main" {
  name = var.project

  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project}/app"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "migrate" {
  name              = "/ecs/${var.project}/migrate"
  retention_in_days = var.log_retention_days
}

locals {
  registry = "${data.aws_caller_identity.me.account_id}.dkr.ecr.${var.region}.amazonaws.com"
  image    = { for name in local.images : name => "${local.registry}/${var.project}-${name}:${var.image_tag}" }

  app_url = (
    local.custom_domain ? "https://${var.domain_name}" :
    local.cloudfront ? "https://${aws_cloudfront_distribution.main[0].domain_name}" :
    "http://${aws_lb.main.dns_name}"
  )

  log_config = {
    logDriver = "awslogs"
    options = {
      "awslogs-group"         = aws_cloudwatch_log_group.app.name
      "awslogs-region"        = var.region
      "awslogs-stream-prefix" = "app"
    }
  }

  # bedrock, openai e fake são os únicos providers que apps/ai aceita; qualquer
  # outro reprova a validação do Settings e vira 500 em toda requisição. Os dois
  # ramos carregam variáveis diferentes, e por isso isto é troca e não união —
  # um OPENAI_MODEL velho passeando sob bedrock pareceria estar em uso.
  ai_environment = concat(
    [
      { name = "PORT", value = "8000" },
      { name = "LLM_PROVIDER", value = var.llm_provider },
      { name = "SYSTEM_PROMPT", value = trimspace(var.ai_system_prompt) },
      # Liga log em JSON e faz o Settings recusar LLM_PROVIDER=fake de saída. O
      # provider falso nunca substitui em silêncio uma falha real.
      { name = "PRODUCTION", value = "true" },
    ],
    var.llm_provider == "bedrock" ? [
      { name = "BEDROCK_REGION", value = var.bedrock_region },
      { name = "BEDROCK_MODEL", value = var.bedrock_model },
      ] : [
      { name = "OPENAI_MODEL", value = var.openai_model },
    ],
  )

  # Sob bedrock não há credencial de modelo alguma: o serviço assina uma chave
  # de curta duração a partir da task role em cada requisição.
  ai_secrets = concat(
    [{ name = "INTERNAL_TOKEN", valueFrom = aws_ssm_parameter.internal_token.arn }],
    [for p in aws_ssm_parameter.openai_api_key : { name = "OPENAI_API_KEY", valueFrom = p.arn }],
  )

  seed_command = var.seed_demo_data ? "pnpm exec prisma migrate deploy && pnpm exec prisma db seed" : "pnpm exec prisma migrate deploy"
}

# Uma task, três containers, um namespace de rede. Eles se alcançam por
# localhost, o que mantém 3001 e 8000 fora do security group e deixa o destino
# do rewrite constante — o `next build` o grava em routes-manifest.json.
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project}-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  # Nenhum container declara healthCheck aqui, e é decisão, não esquecimento.
  # Com `essential = true` nos três, um health check da IA reprovando derrubaria
  # a task inteira — e o app funciona sem IA: login, trilha, metas e painel do
  # gestor não dependem dela. O portão do deploy é o health check do ALB sobre o
  # web; a IA indisponível aparece como erro numa tela, não como app fora do ar.
  container_definitions = jsonencode([
    {
      name      = "web"
      image     = local.image["web"]
      essential = true
      portMappings = [{
        containerPort = 3000
        protocol      = "tcp"
      }]
      # NEXT_PUBLIC_API_URL e API_URL não aparecem aqui de propósito: os dois são
      # argumentos de build. O primeiro vai para o bundle do navegador, o segundo
      # para o routes-manifest. Definidos em runtime não teriam efeito nenhum.
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "HOSTNAME", value = "0.0.0.0" },
        { name = "NEXT_TELEMETRY_DISABLED", value = "1" },
      ]
      logConfiguration = local.log_config
    },
    {
      name      = "api"
      image     = local.image["api"]
      essential = true
      environment = [
        # Liga log em JSON, esconde o Swagger e exige AI_INTERNAL_TOKEN de 32+.
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        # Com o rewrite `/api/*` o navegador nunca faz requisição cross-origin,
        # então isto é cinto e suspensório: a origem pública é a única aceita se
        # alguém passar a chamar a API direto.
        { name = "CORS_ORIGINS", value = local.app_url },
        { name = "AI_SERVICE_URL", value = "http://localhost:8000" },
        # O Python tem 50s de prazo; a Core API, 60. A ordem importa: quem corta
        # primeiro é quem consegue emitir o evento `error` do contrato.
        { name = "AI_TIMEOUT_MS", value = "60000" },
        { name = "THROTTLE_LIMIT", value = tostring(var.throttle_limit) },
        { name = "THROTTLE_WINDOW_MS", value = "60000" },
        { name = "JOURNEY_WINDOW_ZONE", value = var.journey_window_zone },
        { name = "JOURNEY_WINDOW_DAYS", value = var.journey_window_days },
        { name = "JOURNEY_WINDOW_OPENS", value = var.journey_window_opens },
        { name = "JOURNEY_WINDOW_CLOSES", value = var.journey_window_closes },
      ]
      secrets = [
        { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
        { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.jwt_secret.arn },
        # Mesmo valor que o INTERNAL_TOKEN do Python, nome diferente: a Core API
        # o envia, o FastAPI o confere.
        { name = "AI_INTERNAL_TOKEN", valueFrom = aws_ssm_parameter.internal_token.arn },
      ]
      logConfiguration = local.log_config
    },
    {
      name        = "ai"
      image       = local.image["ai"]
      essential   = true
      environment = local.ai_environment
      secrets     = local.ai_secrets

      logConfiguration = local.log_config
    },
  ])
}

# Task própria, e não sidecar. Um sidecar que falha deixa web e ai saudáveis, e
# aí o deploy fica verde com o banco sem migrar.
resource "aws_ecs_task_definition" "migrate" {
  family                   = "${var.project}-migrate"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "migrate"
      image     = local.image["migrate"]
      essential = true
      # `&&`, então precisa de shell. A semente vem depois das migrations porque
      # grava nas tabelas que elas acabaram de criar, e é idempotente: repetir o
      # deploy não duplica peça, pessoa nem histórico.
      command = ["/bin/sh", "-c", local.seed_command]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "SEED_ADMIN_EMAIL", value = var.seed_admin_email },
        { name = "SEED_ADMIN_NAME", value = "Gestor da Unidade" },
        { name = "SEED_WORKER_EMAIL", value = var.seed_worker_email },
        { name = "SEED_WORKER_NAME", value = "Colaborador" },
        { name = "SEED_COMPANY_NAME", value = var.seed_company_name },
        { name = "SEED_COMPANY_SLUG", value = var.seed_company_slug },
      ]
      secrets = [
        { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
        { name = "SEED_ADMIN_PASSWORD", valueFrom = aws_ssm_parameter.seed_admin_password.arn },
        { name = "SEED_WORKER_PASSWORD", valueFrom = aws_ssm_parameter.seed_worker_password.arn },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.migrate.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "migrate"
        }
      }
    },
  ])
}

resource "aws_ecs_service" "app" {
  name            = "${var.project}-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  launch_type     = "FARGATE"

  # Uma task. Duas custariam o dobro sem resolver nada que a demonstração
  # precise, e a sessão já é stateless: o token vive na memória do navegador.
  desired_count                      = 1
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  # Três imagens para baixar antes de o primeiro health check ter chance.
  health_check_grace_period_seconds = 120

  enable_execute_command = true

  network_configuration {
    subnets = aws_subnet.public[*].id
    # IP público em vez de NAT gateway. Quem mantém a task privada é o security
    # group: só a 3000, e só a partir do ALB.
    assign_public_ip = true
    security_groups  = [aws_security_group.task.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]

  lifecycle {
    # O workflow de deploy registra revisões novas. Sem isto, o próximo
    # `terraform apply` devolveria o serviço à imagem de bootstrap.
    ignore_changes = [task_definition, desired_count]
  }
}
