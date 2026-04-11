data "aws_caller_identity" "current" {}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  # Public endpoint so kubectl works from local machine
  cluster_endpoint_public_access = true

  bootstrap_self_managed_addons = false

  # OIDC provider — required for IRSA (IAM roles for service accounts)
  enable_irsa = true

  # Grant the Terraform caller full cluster admin from the start.
  # Este flag ya crea automáticamente el Access Entry para el caller de Terraform,
  # por lo que NO se debe definir también en access_entries (causaría 409 Conflict).
  enable_cluster_creator_admin_permissions = true

  cluster_addons = {
    # vpc-cni y kube-proxy deben instalarse ANTES de los nodos (before_compute = true)
    # para romper el ciclo: nodos necesitan CNI para ser Ready, CNI necesita nodos
    # para volverse ACTIVE. Sin esto → timeout de 20 min en terraform apply.
    vpc-cni = {
      most_recent    = true
      before_compute = true
    }
    kube-proxy = {
      most_recent    = true
      before_compute = true
    }
    coredns        = { most_recent = true }
    metrics-server = { most_recent = true }
  }

  eks_managed_node_groups = {
    travelhub_nodes = {
      name           = "${var.cluster_name}-ng"
      instance_types = [var.node_instance_type]
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      desired_size   = var.node_desired_size
      subnet_ids     = var.private_subnet_ids

      labels = { project = var.project }

      tags = merge(var.common_tags, {
        Name = "${var.cluster_name}-node"
      })
    }
  }

  tags = merge(var.common_tags, {
    Name = var.cluster_name
  })
}

