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
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
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
  node_max_size        = 10
  node_desired_size    = 2
  common_tags          = local.common_tags
}

# ─── KARPENTER ───────────────────────────────────────────────────────────────

module "karpenter" {
  source = "../../modules/karpenter"

  project                = local.project
  environment            = local.environment
  cluster_name           = local.cluster_name
  cluster_endpoint       = module.eks.cluster_endpoint
  cluster_ca             = module.eks.cluster_certificate_authority_data
  node_security_group_id = module.eks.node_security_group_id
  oidc_provider_arn      = data.aws_iam_openid_connect_provider.eks.arn
  oidc_provider_url      = module.eks.cluster_oidc_issuer_url
  common_tags            = local.common_tags
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

# ─── nginx-ingress — instalación via Helm ─────────────────────────────────────
# Crea el ELB en AWS que sirve como punto de entrada al cluster.
# Terraform lee el DNS del ELB después y lo pasa automáticamente al CDN.

resource "null_resource" "nginx_ingress" {
  depends_on = [module.eks]

  triggers = {
    cluster_name = local.cluster_name
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      echo "=== Configurando kubectl ==="
      aws eks update-kubeconfig --name ${local.cluster_name} --region ${local.region}

      echo "=== Instalando nginx-ingress via Helm ==="
      helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx --force-update
      helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        -n ingress-nginx \
        --create-namespace \
        --wait --timeout 5m

      echo "=== Esperando que AWS provisione el ELB (puede tardar 1-2 min) ==="
      for i in $(seq 1 30); do
        HOSTNAME=$(kubectl get svc ingress-nginx-controller -n ingress-nginx \
          -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
        [ -n "$HOSTNAME" ] && echo "ELB listo: $HOSTNAME" && break
        echo "Intento $i, esperando 10s..."
        sleep 10
      done

      echo "=== Aplicando namespace y ingress routes ==="
      kubectl apply -f ${path.root}/../../../kubernetes/namespaces/travelhub.yaml
      kubectl apply -f ${path.root}/../../../kubernetes/ingress/ingress.yaml

      echo "=== nginx-ingress listo ==="
    EOT
  }
}

# Lee el DNS del ELB creado por nginx-ingress para pasárselo al CDN
data "external" "nginx_elb" {
  depends_on = [null_resource.nginx_ingress]
  program = ["bash", "-c", "printf '{\"hostname\":\"%s\"}' $(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo '')"]
}

# ─── CDN (CloudFront) ─────────────────────────────────────────────────────────
# El ELB DNS se obtiene automáticamente de nginx-ingress después de instalarlo.

module "cdn" {
  source = "../../modules/cdn"

  project      = local.project
  environment  = local.environment
  elb_dns_name = data.external.nginx_elb.result["hostname"]
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

# ─── Booking Service SMTP secret en AWS Secrets Manager (para ESO) ──────────

resource "aws_secretsmanager_secret" "booking_smtp" {
  name                    = "${local.project}/${local.environment}/booking-smtp"
  recovery_window_in_days = 0
  tags                    = local.common_tags
}

resource "aws_secretsmanager_secret_version" "booking_smtp" {
  secret_id = aws_secretsmanager_secret.booking_smtp.id
  secret_string = jsonencode({
    BOOKING_SMTP_APP_PASSWORD = "aaxu infb wzlw ijbs"
  })
}

# ─── Stripe secrets en AWS Secrets Manager (para ESO) ─────────────────────────

resource "aws_secretsmanager_secret" "stripe" {
  name                    = "${local.project}/${local.environment}/stripe"
  recovery_window_in_days = 0
  tags                    = local.common_tags
}

resource "aws_secretsmanager_secret_version" "stripe" {
  secret_id = aws_secretsmanager_secret.stripe.id
  secret_string = jsonencode({
    STRIPE_SECRET_KEY      = "sk_test_51TLw9h1OQGmvzWnQJUPk54arfs9Taj6Qz2nhraSC0jKn3nYb277u6cyUquKUutjwiPLkzEw0WYZegSC8uneuef6C00zgbSgJdO"
    STRIPE_PUBLISHABLE_KEY = "pk_test_51TLw9h1OQGmvzWnQuLdVF3czhNz5oGtpMsbUQMxXyRdUa4ENew6PTntwA62yfhqglHbxrdf8WQduSSjXKMFiBFQ500PzxxuHiC"
    STRIPE_WEBHOOK_SECRET  = "whsec_xl0LvihMoLcr1zsFC6xDLdxRl8Tp4VGN"
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
    aws_secretsmanager_secret_version.booking_smtp,
    aws_secretsmanager_secret_version.stripe,
  ]

  triggers = {
    cluster_name = local.cluster_name
    role_arn     = aws_iam_role.external_secrets.arn
    smtp_secret  = aws_secretsmanager_secret_version.booking_smtp.id
    stripe_secret = aws_secretsmanager_secret_version.stripe.id
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

      echo "=== Esperando que el API server sirva ClusterSecretStore ==="
      for i in $(seq 1 20); do
        rm -rf ~/.kube/cache/discovery/
        kubectl get clustersecretstores 2>/dev/null && break
        echo "Tipo no disponible aún, intento $i, esperando 15s..."
        sleep 15
      done

      echo "=== Aplicando ClusterSecretStore ==="
      kubectl apply -f ${path.root}/../../../kubernetes/config/cluster-secret-store.yaml

      echo "=== Creando namespace travelhub ==="
      kubectl apply -f ${path.root}/../../../kubernetes/namespaces/travelhub.yaml

      echo "=== Aplicando ExternalSecrets ==="
      kubectl apply -f ${path.root}/../../../kubernetes/storage/secrets-template.yaml

      echo "=== ESO instalado correctamente ==="
    EOT
  }
}

