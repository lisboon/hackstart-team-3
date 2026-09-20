locals {
  # Três formas de ser alcançável, da mais apresentável para a menos.
  custom_domain = var.domain_name != ""
  cloudfront    = !local.custom_domain && var.enable_cloudfront

  # Se o navegador vê https. É o que decide se o service worker do PWA existe:
  # `navigator.serviceWorker` é undefined fora de contexto seguro, e aí não há
  # instalação nem tela offline.
  secure_public_url = local.custom_domain || local.cloudfront
}

# ------------------------------------------------------------ domínio próprio
resource "aws_acm_certificate" "main" {
  count = local.custom_domain ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.custom_domain ? {
    for option in aws_acm_certificate.main[0].domain_validation_options :
    option.domain_name => {
      name   = option.resource_record_name
      type   = option.resource_record_type
      record = option.resource_record_value
    }
  } : {}

  zone_id         = data.aws_route53_zone.main[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "main" {
  count = local.custom_domain ? 1 : 0

  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_route53_record" "apex" {
  count = local.custom_domain ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# --------------------------------------------------------------------- alb
resource "aws_lb" "main" {
  name               = "${var.project}-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  # A IA responde por SSE. O padrão de 60s cabe dentro do intervalo entre o
  # pedido e o primeiro token de uma chamada fria de modelo, e o corte chegaria
  # como stream interrompido — que o frontend trata como falha, de propósito.
  idle_timeout               = 300
  drop_invalid_header_fields = true
}

resource "aws_lb_target_group" "web" {
  name        = "${var.project}-web"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  # Stream de SSE quebra na drenagem de qualquer jeito; não há o que esperar.
  deregistration_delay = 30

  # "/" é a raiz do app, sem sessão, sem chamada à API e sem banco. De propósito
  # não é `/api/health/ready`: aquele encosta no Postgres, e uma oscilação do
  # banco derrubaria a task inteira em vez de devolver 503 numa rota só.
  health_check {
    path                = "/"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 3600
    enabled         = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # Com certificado no balanceador, a 80 só existe para empurrar para a 443.
  # Sem ele — HTTP puro, ou CloudFront terminando o TLS na borda — ela é a
  # entrada de verdade.
  dynamic "default_action" {
    for_each = local.custom_domain ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  dynamic "default_action" {
    for_each = local.custom_domain ? [] : [1]
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.web.arn
    }
  }
}

resource "aws_lb_listener" "https" {
  count = local.custom_domain ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# `/api/*` é encaminhado inteiro para a Core API, então o Swagger viria junto se
# alguém subisse a task sem NODE_ENV=production — é a única condição que o
# registra. Esta regra é a camada que sobrevive a essa troca.
resource "aws_lb_listener_rule" "block_internals" {
  listener_arn = local.custom_domain ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
  priority     = 1

  condition {
    path_pattern {
      values = ["/api/api-docs", "/api/api-docs/*"]
    }
  }

  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "not found"
      status_code  = "404"
    }
  }
}
