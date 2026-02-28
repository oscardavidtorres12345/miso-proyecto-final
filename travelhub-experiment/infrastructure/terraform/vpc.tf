module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  # Subnets privadas — los nodos del cluster van aquí
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]

  # Subnets públicas — el Load Balancer del gateway va aquí
  public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true  # 1 NAT es suficiente para un POC
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tags requeridos por EKS para descubrir las subnets automáticamente
  public_subnet_tags = {
    "kubernetes.io/role/elb"                        = "1"
    "kubernetes.io/cluster/${var.cluster_name}"     = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"               = "1"
    "kubernetes.io/cluster/${var.cluster_name}"     = "shared"
  }

  tags = {
    Project     = "travelhub-poc"
    Environment = var.environment
  }
}

