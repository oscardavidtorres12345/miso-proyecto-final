output "vpc_id" {
  value = module.vpc.vpc_id
}

# output "eks_cluster_name" {
#   value = module.eks.cluster_name
# }
#
# output "eks_cluster_endpoint" {
#   value = module.eks.cluster_endpoint
# }

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

