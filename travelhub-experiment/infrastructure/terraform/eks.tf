module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Acceso público al endpoint (para kubectl desde tu máquina)
  cluster_endpoint_public_access = true

  # Debe coincidir con el cluster ya creado en AWS (immutable field)
  bootstrap_self_managed_addons = false

  # Habilitar el OIDC provider (necesario para IAM roles en pods)
  enable_irsa = true

  # ── Permisos de acceso al cluster ─────────────────────────────────────────
  # Garantiza que el caller IAM (usuario/rol que corre terraform) tenga acceso
  # admin a kubectl desde el primer momento, incluso si terraform apply se
  # interrumpe antes de crear los access_entries explícitos.
  enable_cluster_creator_admin_permissions = true

  # Access entry explícito para el caller actual (belt-and-suspenders):
  # cubre el caso en que el cluster fue creado por una sesión/rol diferente.
  access_entries = {
    terraform_caller = {
      principal_arn = data.aws_caller_identity.current.arn
      type          = "STANDARD"
      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }

  # Habilitar el EKS Managed Addons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    # Metrics server — requerido para que el HPA funcione
    metrics-server = {
      most_recent = true
    }
  }

  # Nodos gestionados por AWS (Managed Node Group)
  eks_managed_node_groups = {
    travelhub_nodes = {
      name = "travelhub-ng"

      instance_types = [var.node_instance_type]

      min_size     = var.node_min_size
      max_size     = var.node_max_size
      desired_size = var.node_desired_size

      # Los nodos van en subnets privadas
      subnet_ids = module.vpc.private_subnets

      labels = {
        project = "travelhub-poc"
      }

      tags = {
        Project     = "travelhub-poc"
        Environment = var.environment
      }
    }
  }

  tags = {
    Project     = "travelhub-poc"
    Environment = var.environment
  }
}

