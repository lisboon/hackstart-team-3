output "app_url" {
  description = "Endereço público, com esquema. Vai para a variável APP_URL do GitHub."
  value       = local.app_url
}

output "secure_public_url" {
  description = <<-EOT
    Se a origem pública é https. Falso significa PWA sem service worker: o
    navegador não o registra fora de contexto seguro, então não há instalação
    nem tela offline.
  EOT
  value = local.secure_public_url
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "ecr_registry" {
  value = local.registry
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service" {
  value = aws_ecs_service.app.name
}

output "migrate_task_family" {
  value = aws_ecs_task_definition.migrate.family
}

output "task_subnets" {
  value = aws_subnet.public[*].id
}

output "task_security_group" {
  value = aws_security_group.task.id
}

output "db_endpoint" {
  value = aws_db_instance.main.address
}

output "deploy_role_arn" {
  description = "Vai para o segredo AWS_DEPLOY_ROLE_ARN do GitHub."
  value       = aws_iam_role.github_deploy.arn
}

output "run_migrations_command" {
  description = "Cole para aplicar migrations e semente à mão."
  value = join(" ", [
    "aws ecs run-task --cluster ${aws_ecs_cluster.main.name}",
    "--task-definition ${aws_ecs_task_definition.migrate.family}",
    "--launch-type FARGATE",
    "--network-configuration \"awsvpcConfiguration={subnets=[${join(",", aws_subnet.public[*].id)}],securityGroups=[${aws_security_group.task.id}],assignPublicIp=ENABLED}\"",
  ])
}
