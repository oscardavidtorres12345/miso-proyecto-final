variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_account_id" {
  type = string
}

variable "kms_key_id" {
  type        = string
  description = "KMS key ID for SQS encryption"
}

variable "common_tags" {
  type    = map(string)
  default = {}
}

