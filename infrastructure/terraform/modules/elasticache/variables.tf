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
  description = "EKS node SG allowed to reach Redis on port 6379. Set to null when EKS is not deployed."
  default     = null
}

variable "node_type" {
  type    = string
  default = "cache.t3.micro"
}

variable "num_cache_clusters" {
  type    = number
  default = 1
}

variable "engine_version" {
  type    = string
  default = "7.0"
}

variable "auth_token" {
  type      = string
  sensitive = true
  description = "Redis AUTH token (min 16 chars)"
}

variable "common_tags" {
  type    = map(string)
  default = {}
}

