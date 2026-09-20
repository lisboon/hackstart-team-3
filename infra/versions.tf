terraform {
  required_version = ">= 1.11"

  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Crie o bucket à mão antes do primeiro init: versionamento ligado, bloqueio
  # de acesso público ligado, SSE-S3. O state guarda a senha do RDS em texto
  # claro. `use_lockfile` substitui a antiga tabela de lock no DynamoDB.
  backend "s3" {
    key          = "prod/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}
