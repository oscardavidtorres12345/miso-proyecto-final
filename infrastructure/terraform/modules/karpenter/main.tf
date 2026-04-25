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
