resource "aws_cloudfront_distribution" "travelhub" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.project}-${var.environment} CDN"
  price_class     = "PriceClass_100" # US, Canada, Europe — más barato

  # ── Origin: ELB del nginx ingress ─────────────────────────────────────────
  origin {
    domain_name = var.elb_dns_name
    origin_id   = "elb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # ELB solo tiene HTTP por ahora
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # ── Comportamiento por defecto (API — sin caché) ───────────────────────────
  default_cache_behavior {
    target_origin_id       = "elb-origin"
    viewer_protocol_policy = "allow-all" # HTTP y HTTPS aceptados en el edge

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    # Forwarding: pasar todo al origen (comportamiento de proxy, sin caché real)
    forwarded_values {
      query_string = true
      headers      = ["*"] # Forward todos los headers (Authorization, Content-Type, etc.)

      cookies {
        forward = "all"
      }
    }

    # TTL mínimo = 0 → no cachear respuestas de la API
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0

    compress = true
  }

  # ── Restricciones geográficas ──────────────────────────────────────────────
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # ── Certificado: CloudFront default (*.cloudfront.net) ────────────────────
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-cdn"
  })
}

