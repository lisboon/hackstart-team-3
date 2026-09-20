data "aws_caller_identity" "me" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Data source de propósito: registrar o domínio no Route 53 já cria a hosted
# zone. Uma segunda zona teria NS diferentes da delegação do registrador, e a
# validação do ACM ficaria pendurada até expirar.
data "aws_route53_zone" "main" {
  count = local.custom_domain ? 1 : 0

  name         = var.domain_name
  private_zone = false
}
