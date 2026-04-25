locals {
  oidc_url = replace(var.cluster_oidc_issuer_url, "https://", "")
}

# ─── Karpenter Node IAM Role ─────────────────────────────────────────────────
resource "aws_iam_role" "karpenter_node" {
  name = "${var.project}-${var.environment}-karpenter-node"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-karpenter-node"
  })
}

resource "aws_iam_role_policy_attachment" "karpenter_node_worker" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.karpenter_node.name
}

resource "aws_iam_role_policy_attachment" "karpenter_node_cni" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.karpenter_node.name
}

resource "aws_iam_role_policy_attachment" "karpenter_node_ecr" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.karpenter_node.name
}

resource "aws_iam_instance_profile" "karpenter_node" {
  name = "${var.project}-${var.environment}-karpenter-node"
  role = aws_iam_role.karpenter_node.name

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-karpenter-node"
  })
}

# Permiso adicional requerido para que la AMI AL2023 (nodeadm) obtenga el endpoint
# y el certificado CA del cluster EKS via la API de EKS.
resource "aws_iam_role_policy" "karpenter_node_eks_describe" {
  name = "${var.project}-${var.environment}-karpenter-node-eks-describe"
  role = aws_iam_role.karpenter_node.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["eks:DescribeCluster"]
      Resource = "arn:aws:eks:*:${data.aws_caller_identity.current.account_id}:cluster/${var.cluster_name}"
    }]
  })
}

# Access Entry que autoriza a los nodos Karpenter a registrarse en el cluster EKS.
# Sin esto, kubelet bootstrappea pero el API server rechaza la autenticacion del nodo.
resource "aws_eks_access_entry" "karpenter_node" {
  cluster_name  = var.cluster_name
  principal_arn = aws_iam_role.karpenter_node.arn
  type          = "EC2_LINUX"
}

# ─── Karpenter Controller IAM Role (IRSA) ───────────────────────────────────
resource "aws_iam_role" "karpenter_controller" {
  name = "${var.project}-${var.environment}-karpenter-controller"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${local.oidc_url}"
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_url}:sub" = "system:serviceaccount:karpenter:karpenter"
          "${local.oidc_url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-karpenter-controller"
  })
}

data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "karpenter_controller" {
  name = "${var.project}-${var.environment}-karpenter-controller"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "KarpenterEC2"
        Effect = "Allow"
        Action = [
          "ec2:CreateLaunchTemplate",
          "ec2:CreateFleet",
          "ec2:RunInstances",
          "ec2:CreateTags",
          "ec2:TerminateInstances",
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeInstanceTypeOfferings",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSpotPriceHistory",
          "ec2:DescribeLaunchTemplates",
          "ec2:DeleteLaunchTemplate",
          "ec2:DescribeImages",
          "ec2:GetInstanceUptime",
          "pricing:GetProducts",
          "eks:DescribeCluster",
          "ssm:GetParameter",
          "iam:PassRole",
        ]
        Resource = "*"
      },
      {
        Sid    = "KarpenterSQS"
        Effect = "Allow"
        Action = [
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ReceiveMessage",
        ]
        Resource = aws_sqs_queue.karpenter_interruption.arn
      },
      {
        Sid    = "KarpenterPassRole"
        Effect = "Allow"
        Action = ["iam:PassRole"]
        Resource = aws_iam_role.karpenter_node.arn
      },
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "karpenter_controller" {
  policy_arn = aws_iam_policy.karpenter_controller.arn
  role       = aws_iam_role.karpenter_controller.name
}

# ─── Spot Interruption SQS Queue ──────────────────────────────────────────────
resource "aws_sqs_queue" "karpenter_interruption" {
  name = "${var.project}-${var.environment}-karpenter-interruption"

  message_retention_seconds  = 300
  visibility_timeout_seconds = 60

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-karpenter-interruption"
  })
}

# ─── EC2NodeClass YAML renderizado (dinamico desde template) ────────────────
# Genera el manifesto Kubernetes EC2NodeClass con valores dinamicos de Terraform
# (instance_profile y node_security_group_id) para evitar hardcoding.
resource "local_file" "ec2nodeclass_rendered" {
  content = templatefile("${path.module}/../../../kubernetes/karpenter/ec2nodeclass.yaml.tpl", {
    instance_profile       = aws_iam_instance_profile.karpenter_node.name
    node_security_group_id = var.node_security_group_id
  })
  filename = "${path.module}/../../../kubernetes/karpenter/ec2nodeclass-generated.yaml"
}

