# HTTPS sem domínio próprio: a distribuição responde em <id>.cloudfront.net com
# certificado gerenciado pela AWS. É o caminho padrão aqui porque o PWA precisa
# de contexto seguro para registrar o service worker.
locals {
  # Políticas gerenciadas, por id conhecido.
  cache_disabled                = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
  cache_optimized               = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
  origin_all_viewer_except_host = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
}

resource "aws_cloudfront_distribution" "main" {
  count = local.cloudfront ? 1 : 0

  enabled = true
  comment = "${var.project} app"
  # América do Norte e Europa. Nada aqui precisa de presença global.
  price_class = "PriceClass_100"

  origin {
    origin_id   = "alb"
    domain_name = aws_lb.main.dns_name

    custom_origin_config {
      origin_protocol_policy = "http-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
      # Tempo até o primeiro byte. O modelo pode pensar antes do primeiro token
      # de SSE; 60 é o teto sem pedir aumento de quota.
      origin_read_timeout      = 60
      origin_keepalive_timeout = 60
    }
  }

  default_cache_behavior {
    target_origin_id = "alb"
    # Tudo aqui é dinâmico e metade é autenticado. Cachear qualquer coisa
    # serviria a sessão de uma pessoa para outra.
    cache_policy_id          = local.cache_disabled
    origin_request_policy_id = local.origin_all_viewer_except_host

    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    # Os quadros de SSE são minúsculos e a compressão os enfileira.
    compress = false
  }

  # O bundle do Next, que é o oposto de tudo acima: nome com hash de conteúdo,
  # nunca muda, não tem sessão dentro e não é stream. É aqui que a compressão e o
  # cache de borda voltam — `compress = false` no comportamento padrão existe por
  # causa do SSE, e o PWA é para trabalhador em rede móvel, onde o primeiro
  # carregamento pesa.
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    target_origin_id = "alb"
    cache_policy_id  = local.cache_optimized

    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
