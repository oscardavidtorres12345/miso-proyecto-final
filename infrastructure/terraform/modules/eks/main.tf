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

  # Grant the Terraform caller full cluster admin from the start
  enable_cluster_creator_admin_permissions = true

  access_entries = {
    terraform_caller = {
      principal_arn = data.aws_caller_identity.current.arn
      type          = "STANDARD"
      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }
  }

  cluster_addons = {
    coredns        = { most_recent = true }
    kube-proxy     = { most_recent = true }
    vpc-cni        = { most_recent = true }
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

      # Amazon Linux 2023 - Latest long-term supported OS from AWS
      ami_type = "AL2023_x86_64_STANDARD"

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

