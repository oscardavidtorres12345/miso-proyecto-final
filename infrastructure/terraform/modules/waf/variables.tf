variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "log_group_arn" {
  type        = string
  description = "CloudWatch log group ARN for WAF logs (leave empty to disable)"
  default     = ""
}

variable "common_tags" {
  type    = map(string)
  default = {}
}

