variable "cluster_name" {
  type        = string
  description = "EKS cluster name"
}

variable "cluster_oidc_issuer_url" {
  type        = string
  description = "OIDC issuer URL of the EKS cluster (without https:// prefix)"
}

variable "cluster_endpoint" {
  type        = string
  description = "EKS cluster endpoint"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where Karpenter nodes will be launched"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for Karpenter nodes"
}

variable "node_security_group_id" {
  type        = string
  description = "EKS node security group ID to attach to Karpenter nodes"
}

variable "project" {
  type        = string
  description = "Project name for tagging"
}

variable "environment" {
  type        = string
  description = "Environment name for tagging"
}

variable "common_tags" {
  type        = map(string)
  default     = {}
  description = "Common tags to apply to all resources"
}
