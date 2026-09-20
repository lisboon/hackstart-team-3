data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ---------------------------------------------------------------- execution
# Usada pelo agente do ECS, não pelo código: baixa imagem, resolve segredo,
# envia log.
resource "aws_iam_role" "execution" {
  name               = "${var.project}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "execution_secrets" {
  statement {
    # Plural. O agente chama GetParameters; só GetParameter não basta, e a falha
    # aparece como "unable to pull secrets or registry auth".
    actions = ["ssm:GetParameters"]
    resources = concat(
      [
        aws_ssm_parameter.database_url.arn,
        aws_ssm_parameter.jwt_secret.arn,
        aws_ssm_parameter.internal_token.arn,
        aws_ssm_parameter.seed_admin_password.arn,
        aws_ssm_parameter.seed_worker_password.arn,
      ],
      # Vazio a menos que llm_provider seja openai.
      aws_ssm_parameter.openai_api_key[*].arn,
    )
  }

  statement {
    actions   = ["kms:Decrypt"]
    resources = ["arn:aws:kms:${var.region}:${data.aws_caller_identity.me.account_id}:key/*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

# --------------------------------------------------------------------- task
# As credenciais que os containers em execução enxergam. É por aqui que apps/ai
# alcança o Bedrock: ele assina uma chave de curta duração a partir delas em
# cada requisição, então não há chave para guardar nem para rotacionar.
resource "aws_iam_role" "task" {
  name               = "${var.project}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "task" {
  statement {
    sid = "Bedrock"
    # apps/ai chega ao Bedrock pelo bedrock-mantle, o endpoint compatível com a
    # OpenAI, então InvokeModel e os ARNs de inference profile não se aplicam —
    # o mantle decide o roteamento.
    #
    # O curinga é deliberado. Usar chave de curta duração é gated em
    # bedrock-mantle:CallWithBearerToken, mas a ação que autoriza a inferência em
    # si não está na Service Authorization Reference pública, e o CloudTrail só
    # registra as chamadas de gerenciamento (ListModels), não as de dados.
    # Enumerar seria um chute que falha fechado no meio da apresentação. Estreite
    # isto quando a AWS publicar a lista.
    actions   = ["bedrock-mantle:*"]
    resources = ["*"]
  }

  statement {
    sid = "ExecuteCommand"
    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "task" {
  name   = "app"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task.json
}

# ------------------------------------------------------------- github oidc
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # A AWS não verifica mais isto, mas a API ainda exige o campo.
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

locals {
  # StringEquals sobre lista é OR, então isto aceita o subject textual e, quando
  # o repositório já migrou, o imutável. Os dois ficam presos a uma branch:
  # "repo:owner/name:*" deixaria um pull request de fork fazer deploy.
  github_subjects = compact([
    "repo:${var.github_repo}:ref:refs/heads/${var.github_branch}",
    var.github_subject_prefix != "" ? "${var.github_subject_prefix}:ref:refs/heads/${var.github_branch}" : "",
  ])
}

data "aws_iam_policy_document" "github_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.github_subjects
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "${var.project}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
}

data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid     = "EcrLogin"
    actions = ["ecr:GetAuthorizationToken"]
    # Esta ação não tem escopo de recurso.
    resources = ["*"]
  }

  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [for r in aws_ecr_repository.app : r.arn]
  }

  statement {
    sid       = "TaskDefinitions"
    actions   = ["ecs:RegisterTaskDefinition", "ecs:DescribeTaskDefinition"]
    resources = ["*"]
  }

  statement {
    sid       = "Rollout"
    actions   = ["ecs:UpdateService", "ecs:DescribeServices"]
    resources = [aws_ecs_service.app.id]
  }

  statement {
    sid       = "Migrations"
    actions   = ["ecs:RunTask", "ecs:DescribeTasks", "ecs:ListTasks"]
    resources = ["*"]
    condition {
      test     = "ArnEquals"
      variable = "ecs:cluster"
      values   = [aws_ecs_cluster.main.arn]
    }
  }

  statement {
    sid = "PassRoles"
    # Sem isto, RegisterTaskDefinition falha com um AccessDenied seco.
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.execution.arn, aws_iam_role.task.arn]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }

  statement {
    sid       = "ReadLogs"
    actions   = ["logs:GetLogEvents", "logs:FilterLogEvents", "logs:DescribeLogStreams", "logs:DescribeLogGroups"]
    resources = ["${aws_cloudwatch_log_group.app.arn}:*", "${aws_cloudwatch_log_group.migrate.arn}:*"]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
