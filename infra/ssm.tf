resource "random_password" "jwt" {
  # A Core API recusa subir com menos de 32 caracteres.
  length  = 48
  special = false
}

resource "random_password" "internal" {
  # E o Python recusa com menos de 16; a API exige 32 em produção.
  length  = 40
  special = false
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project}/prod/DATABASE_URL"
  type  = "SecureString"
  value = local.database_url
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project}/prod/JWT_SECRET"
  type  = "SecureString"
  value = random_password.jwt.result
}

# O mesmo valor nas duas pontas: a Core API manda em `X-Internal-Token` e o
# FastAPI compara com compare_digest. É o que impede alguém de falar com a IA
# sem passar pela sessão, pelo tenant e pela auditoria.
resource "aws_ssm_parameter" "internal_token" {
  name  = "/${var.project}/prod/INTERNAL_TOKEN"
  type  = "SecureString"
  value = random_password.internal.result
}

# Senhas da demonstração. Vêm de fora porque quem apresenta precisa saber quais
# são; são secretas porque criam contas que entram no app de verdade.
resource "aws_ssm_parameter" "seed_admin_password" {
  name  = "/${var.project}/prod/SEED_ADMIN_PASSWORD"
  type  = "SecureString"
  value = var.seed_admin_password
}

resource "aws_ssm_parameter" "seed_worker_password" {
  name  = "/${var.project}/prod/SEED_WORKER_PASSWORD"
  type  = "SecureString"
  value = var.seed_worker_password
}

# Fornecida em vez de gerada: as outras são segredos desta stack, esta é emitida
# por quem serve o modelo. Ausente no provider bedrock, que assina a própria
# credencial a partir da task role e não tem nada que valha guardar.
resource "aws_ssm_parameter" "openai_api_key" {
  count = var.llm_provider == "openai" ? 1 : 0

  name  = "/${var.project}/prod/OPENAI_API_KEY"
  type  = "SecureString"
  value = var.openai_api_key
}
