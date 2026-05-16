variable "project" {
  type        = string
  description = "Project name for tagging"
}

variable "environment" {
  type        = string
  description = "Environment name for tagging"
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name"
}

variable "cluster_endpoint" {
  type        = string
  description = "EKS cluster endpoint"
}

variable "cluster_ca" {
  type        = string
  description = "EKS cluster CA certificate (base64)"
}

variable "node_security_group_id" {
  type        = string
  description = "EKS node security group ID to attach to Karpenter nodes"
}

variable "oidc_provider_arn" {
  type        = string
  description = "ARN of the EKS OIDC provider for IRSA"
}

variable "oidc_provider_url" {
  type        = string
  description = "URL of the EKS OIDC issuer (with https:// prefix)"
}

variable "common_tags" {
  type        = map(string)
  default     = {}
  description = "Common tags to apply to all resources"
}
