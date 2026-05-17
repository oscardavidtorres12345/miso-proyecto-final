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

variable "firebase_service_account_json" {
  type        = string
  sensitive   = true
  description = "Firebase Admin SDK service account JSON key (contents of the .json file)"
}

