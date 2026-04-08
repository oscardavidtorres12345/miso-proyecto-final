# =============================================================================
# secrets.tf — Secrets Manager para credenciales de APIs externas
#
# Convención de nombres (igual que los secrets de DB):
#   travelhub/{environment}/ext/{service}
#
# El CD lee estos secrets desde Secrets Manager y crea K8s Secrets.
# Nunca se exponen como variables de entorno en código ni en YAMLs de Helm.
# =============================================================================

locals {
  env = "dev"
}

# ── APILayer (Exchange Rate API — usado por currency-service) ─────────────────
resource "aws_secretsmanager_secret" "apilayer" {
  name                    = "travelhub/${local.env}/ext/apilayer"
  description             = "API key para APILayer currency_data — usada por currency-service"
  recovery_window_in_days = 0 # permite recreación inmediata en dev

  tags = {
    Project     = "travelhub"
    Environment = local.env
    Service     = "currency-service"
    Type        = "external-api-key"
  }
}

resource "aws_secretsmanager_secret_version" "apilayer" {
  secret_id = aws_secretsmanager_secret.apilayer.id

  secret_string = jsonencode({
    api_key = var.apilayer_api_key
  })
}
