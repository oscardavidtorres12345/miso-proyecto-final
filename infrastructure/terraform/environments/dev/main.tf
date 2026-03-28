locals {
  project     = "travelhub"
  environment = "dev"
  region      = "us-east-1"
  cluster_name = "travelhub-dev"

  common_tags = {
    Project     = local.project
    Environment = local.environment
    ManagedBy   = "terraform"
    Owner       = "miso-team"
  }
}

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after creating the S3 bucket + DynamoDB table for state
  # backend "s3" {
  #   bucket         = "travelhub-terraform-state-442042525047"
  #   key            = "dev/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "travelhub-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region  = local.region
  profile = "default"

  default_tags {
    tags = local.common_tags
  }
}

# ─── KMS ─────────────────────────────────────────────────────────────────────

module "kms" {
  source      = "../../modules/kms"
  project     = local.project
  environment = local.environment
  common_tags = local.common_tags
}

# ─── VPC ─────────────────────────────────────────────────────────────────────

module "vpc" {
  source       = "../../modules/vpc"
  project      = local.project
  environment  = local.environment
  cluster_name = local.cluster_name
  vpc_cidr     = "10.0.0.0/16"
  common_tags  = local.common_tags
}

# ─── EKS ─────────────────────────────────────────────────────────────────────

module "eks" {
  source = "../../modules/eks"

  project              = local.project
  cluster_name         = local.cluster_name
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnets
  node_instance_type   = "t3.small"
  node_min_size        = 1
  node_max_size        = 3
  node_desired_size    = 2
  common_tags          = local.common_tags
}

# ─── ECR ─────────────────────────────────────────────────────────────────────

module "ecr" {
  source      = "../../modules/ecr"
  common_tags = local.common_tags
}

# ─── RDS ─────────────────────────────────────────────────────────────────────

module "rds" {
  source = "../../modules/rds"

  project                    = local.project
  environment                = local.environment
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnets
  eks_node_security_group_id = module.eks.node_security_group_id
  kms_key_arn                = module.kms.key_arn
  db_password                = var.db_password
  instance_class             = "db.t3.micro"
  multi_az                   = false
  deletion_protection        = false
  common_tags                = local.common_tags
}

# ─── ELASTICACHE (Redis) ──────────────────────────────────────────────────────

module "elasticache" {
  source = "../../modules/elasticache"

  project                    = local.project
  environment                = local.environment
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnets
  eks_node_security_group_id = module.eks.node_security_group_id
  auth_token                 = var.redis_auth_token
  node_type                  = "cache.t3.micro"
  num_cache_clusters         = 1
  common_tags                = local.common_tags
}

# ─── SQS ─────────────────────────────────────────────────────────────────────

module "sqs" {
  source = "../../modules/sqs"

  project        = local.project
  environment    = local.environment
  aws_account_id = "442042525047"
  kms_key_id     = module.kms.key_id
  common_tags    = local.common_tags
}

# ─── WAF ─────────────────────────────────────────────────────────────────────

module "waf" {
  source      = "../../modules/waf"
  project     = local.project
  environment = local.environment
  common_tags = local.common_tags
}

