locals {
  project      = "travelhub"
  environment  = "dev"
  region       = "us-east-1"
  cluster_name = "travelhub-dev"
  db_username  = "travelhub"

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

# ─── PostgreSQL per-service databases ─────────────────────────────────────────
# RDS only creates the default 'postgres' DB. This null_resource runs a
# Kubernetes Job (inside the cluster, which has network access to RDS) to
# CREATE DATABASE for each service after both EKS and RDS are ready.
resource "null_resource" "init_databases" {
  depends_on = [module.rds, module.eks]

  triggers = {
    # Re-run if the RDS endpoint or database list changes
    rds_address = module.rds.address
    databases   = join(",", ["identity_db", "booking_db", "search_db", "payment_db"])
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      echo "Configuring kubectl for ${local.cluster_name}..."
      aws eks update-kubeconfig --name ${local.cluster_name} --region ${local.region}

      echo "Applying init-databases Job..."
      kubectl apply -f - <<JOB
      apiVersion: batch/v1
      kind: Job
      metadata:
        name: init-databases
        namespace: kube-system
      spec:
        ttlSecondsAfterFinished: 120
        template:
          spec:
            restartPolicy: Never
            containers:
            - name: psql
              image: postgres:15-alpine
              env:
              - name: PGPASSWORD
                value: "${var.db_password}"

              command:
              - sh
              - -c
              - |
                HOST="${module.rds.address}"
                USER="${local.db_username}"
                for DB in identity_db booking_db search_db payment_db; do
                  EXISTS=$$(psql -h $$HOST -U $$USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$$DB'")
                  if [ "$$EXISTS" = "1" ]; then
                    echo "$$DB: already exists"
                  else
                    psql -h $$HOST -U $$USER -d postgres -c "CREATE DATABASE $$DB;" && echo "$$DB: CREATED"
                  fi
                done
                echo "Done."
      JOB

      echo "Waiting for init-databases Job to complete..."
      kubectl wait job/init-databases -n kube-system --for=condition=complete --timeout=120s
      kubectl logs job/init-databases -n kube-system
      kubectl delete job/init-databases -n kube-system --ignore-not-found
    EOT
  }
}

# ─── CDN (CloudFront) ─────────────────────────────────────────────────────────

module "cdn" {
  source = "../../modules/cdn"

  project      = local.project
  environment  = local.environment
  elb_dns_name = "a721065585d854c6fb12a8906256b15f-1033717945.us-east-1.elb.amazonaws.com"
  common_tags  = local.common_tags
}

