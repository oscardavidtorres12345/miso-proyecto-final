data "aws_caller_identity" "current" {}

locals {
  project      = "travelhub"
  environment  = "dev"
  region       = "us-east-1"
  cluster_name = "travelhub-dev"
  account_id   = data.aws_caller_identity.current.account_id

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

# ─── CDN (CloudFront) ─────────────────────────────────────────────────────────

module "cdn" {
  source = "../../modules/cdn"

  project      = local.project
  environment  = local.environment
  elb_dns_name = "a721065585d854c6fb12a8906256b15f-1033717945.us-east-1.elb.amazonaws.com"
  common_tags  = local.common_tags
}

# ─── External Secrets Operator — IAM Role (IRSA) ──────────────────────────────
# Permite que ESO lea secrets de AWS Secrets Manager usando la identidad del pod
# (IRSA = IAM Roles for Service Accounts via OIDC).

data "aws_iam_openid_connect_provider" "eks" {
  url = module.eks.cluster_oidc_issuer_url
}

resource "aws_iam_role" "external_secrets" {
  name = "${local.project}-${local.environment}-external-secrets"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = data.aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        StringEquals = {
          "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub" = "system:serviceaccount:external-secrets:external-secrets"
          "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "external_secrets" {
  name = "secrets-manager-read"
  role = aws_iam_role.external_secrets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:ListSecretVersionIds"
      ]
      Resource = "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${local.project}/${local.environment}/*"
    }]
  })
}

# ─── Redis secret en AWS Secrets Manager (para ESO) ───────────────────────────

resource "aws_secretsmanager_secret" "redis" {
  name                    = "${local.project}/${local.environment}/redis"
  recovery_window_in_days = 0
  tags                    = local.common_tags
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    url = "rediss://:${var.redis_auth_token}@${module.elasticache.primary_endpoint}:6379"
  })
}

# ─── External Secrets Operator — instalación via Helm ─────────────────────────
# Instala ESO en el cluster, crea el ClusterSecretStore y aplica los
# ExternalSecrets de todos los servicios. Se ejecuta automáticamente en cada
# terraform apply si cambia el cluster o el IAM role.

resource "null_resource" "external_secrets_operator" {
  depends_on = [
    module.eks,
    aws_iam_role_policy.external_secrets,
    aws_secretsmanager_secret_version.redis,
  ]

  triggers = {
    cluster_name = local.cluster_name
    role_arn     = aws_iam_role.external_secrets.arn
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      echo "=== Configurando kubectl para ${local.cluster_name} ==="
      aws eks update-kubeconfig --name ${local.cluster_name} --region ${local.region}

      echo "=== Instalando External Secrets Operator via Helm ==="
      helm repo add external-secrets https://charts.external-secrets.io --force-update
      helm upgrade --install external-secrets external-secrets/external-secrets \
        -n external-secrets \
        --create-namespace \
        --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="${aws_iam_role.external_secrets.arn}" \
        --wait --timeout 5m

      echo "=== Esperando que los CRDs de ESO estén listos ==="
      kubectl wait --for condition=established \
        crd/clustersecretstores.external-secrets.io \
        crd/externalsecrets.external-secrets.io \
        --timeout=90s

      echo "=== Aplicando ClusterSecretStore (con reintentos hasta que el API server registre los CRDs) ==="
      for i in $(seq 1 12); do
        rm -rf ~/.kube/cache/discovery/
        kubectl apply -f ${path.root}/../../../kubernetes/config/cluster-secret-store.yaml && break
        echo "Intento $i fallido, esperando 15s..."
        sleep 15
      done

      echo "=== Creando namespace travelhub ==="
      kubectl apply -f ${path.root}/../../../kubernetes/namespaces/travelhub.yaml

      echo "=== Aplicando ExternalSecrets ==="
      kubectl apply -f ${path.root}/../../../kubernetes/storage/secrets-template.yaml

      echo "=== ESO instalado correctamente ==="
    EOT
  }
}

