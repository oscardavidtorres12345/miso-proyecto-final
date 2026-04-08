variable "db_password" {
  type        = string
  sensitive   = true
  description = "Master password for the shared RDS PostgreSQL instance"
}

variable "redis_auth_token" {
  type        = string
  sensitive   = true
  description = "AUTH token for ElastiCache Redis (min 16 chars)"
}

variable "apilayer_api_key" {
  type        = string
  sensitive   = true
  description = "API key for APILayer currency_data (https://apilayer.com) — used by currency-service"
}

