output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of private subnet IDs (EKS nodes + RDS)"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs (ALB)"
  value       = module.vpc.public_subnets
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

