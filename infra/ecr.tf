locals {
  # `migrate` sai do mesmo Dockerfile da API, no stage `migrator`. Repositório
  # separado porque a task de migration é separada: um sidecar que falha deixa
  # web e ai saudáveis, e o deploy fica verde com a API morta.
  images = toset(["web", "api", "ai", "migrate"])
}

resource "aws_ecr_repository" "app" {
  for_each = local.images

  name = "${var.project}-${each.key}"
  # IMMUTABLE significa que cada deploy empurra :<sha> e nada é sobrescrito.
  # Também é o motivo de a primeira aplicação ser em duas etapas — ver o README.
  image_tag_mutability = "IMMUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each = aws_ecr_repository.app

  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "keep the last 8 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 8
      }
      action = { type = "expire" }
    }]
  })
}
