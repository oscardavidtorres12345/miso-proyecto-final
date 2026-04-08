variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "eks_node_security_group_id" {
  type        = string
  description = "EKS node SG allowed to reach RDS on port 5432"
}

variable "kms_key_arn" {
  type        = string
  description = "KMS key ARN for RDS storage encryption"
}

variable "databases" {
  type        = list(string)
  description = "List of database names to create secrets for"
  default     = ["search_db", "booking_db", "payment_db", "identity_db", "hotel_db", "currency_db"]
}

variable "db_username" {
  type      = string
  sensitive = true
  default   = "travelhub"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "postgres_version" {
  type    = string
  default = "15.7"
}

variable "instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "max_allocated_storage" {
  type    = number
  default = 100
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "deletion_protection" {
  type    = bool
  default = false
}

variable "common_tags" {
  type    = map(string)
  default = {}
}

