output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "rds_endpoint" {
  value     = module.rds.endpoint
  sensitive = false
}

output "rds_secret_arns" {
  value = module.rds.secret_arns
}

output "redis_endpoint" {
  value = module.elasticache.primary_endpoint
}

output "sqs_queue_urls" {
  value = module.sqs.queue_urls
}

output "waf_web_acl_arn" {
  value = module.waf.web_acl_arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution URL — use this as the public endpoint"
  value       = module.cdn.domain_name
}

output "cloudfront_distribution_id" {
  value = module.cdn.distribution_id
}

output "karpenter_controller_role_arn" {
  description = "IRSA role ARN for Karpenter controller — use in Helm values serviceAccount.annotations"
  value       = module.karpenter.controller_role_arn
}

output "karpenter_node_instance_profile" {
  description = "Instance profile name for Karpenter nodes — use in EC2NodeClass"
  value       = module.karpenter.node_instance_profile_name
}

output "karpenter_interruption_queue_name" {
  description = "SQS queue name for spot interruption handling — use in Karpenter Helm values"
  value       = module.karpenter.interruption_queue_name
}

