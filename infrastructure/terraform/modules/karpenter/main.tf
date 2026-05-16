data "aws_caller_identity" "current" {}

# IAM Role for Karpenter Controller (IRSA via OIDC)
resource "aws_iam_role" "karpenter_controller" {
  name = "${var.project}-${var.environment}-karpenter-controller"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "${replace(var.oidc_provider_url, "https://", "")}:aud" = "sts.amazonaws.com"
          "${replace(var.oidc_provider_url, "https://", "")}:sub" = "system:serviceaccount:karpenter:karpenter"
        }
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-karpenter-controller"
  })
}

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
          "ec2:DescribeInstanceStatus",
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
          "iam:PassRole"
        ]
        Resource = "*"
      },
      {
        Sid      = "KarpenterSQS"
        Effect   = "Allow"
        Action   = ["sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl", "sqs:ReceiveMessage"]
        Resource = aws_sqs_queue.karpenter_interruption.arn
      },
      {
        Sid      = "KarpenterPassRole"
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = aws_iam_role.karpenter_node.arn
      },
      {
        Sid    = "KarpenterInstanceProfiles"
        Effect = "Allow"
        Action = [
          "iam:CreateInstanceProfile",
          "iam:AddRoleToInstanceProfile",
          "iam:RemoveRoleFromInstanceProfile",
          "iam:DeleteInstanceProfile",
          "iam:GetInstanceProfile",
          "iam:ListInstanceProfiles",
          "iam:ListInstanceProfilesForRole"
        ]
        Resource = [
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:instance-profile/*",
          aws_iam_role.karpenter_node.arn
        ]
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "karpenter_controller" {
  role       = aws_iam_role.karpenter_controller.name
  policy_arn = aws_iam_policy.karpenter_controller.arn
}

# IAM Role for Karpenter Nodes (EC2 instance profile)
resource "aws_iam_role" "karpenter_node" {
  name = "${var.project}-${var.environment}-karpenter-node"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-karpenter-node"
  })
}

resource "aws_iam_role_policy_attachment" "karpenter_node_worker" {
  role       = aws_iam_role.karpenter_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "karpenter_node_cni" {
  role       = aws_iam_role.karpenter_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "karpenter_node_ecr" {
  role       = aws_iam_role.karpenter_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

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

resource "aws_iam_instance_profile" "karpenter_node" {
  name = "${var.project}-${var.environment}-karpenter-node"
  role = aws_iam_role.karpenter_node.name

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-karpenter-node"
  })
}

# EKS Access Entry for Karpenter nodes
resource "aws_eks_access_entry" "karpenter_node" {
  cluster_name  = var.cluster_name
  principal_arn = aws_iam_role.karpenter_node.arn
  type          = "EC2_LINUX"
}

# SQS Queue for interruption handling
resource "aws_sqs_queue" "karpenter_interruption" {
  name                        = "${var.project}-${var.environment}-karpenter-interruption"
  message_retention_seconds   = 300
  sqs_managed_sse_enabled     = true
  visibility_timeout_seconds  = 60

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-karpenter-interruption"
  })
}

# Render EC2NodeClass manifest
resource "local_file" "ec2nodeclass_rendered" {
  content = templatefile("${path.module}/../../../kubernetes/karpenter/ec2nodeclass.yaml.tpl", {
    instance_profile       = aws_iam_instance_profile.karpenter_node.name
    node_security_group_id = var.node_security_group_id
  })
  filename = "${path.module}/../../../kubernetes/karpenter/ec2nodeclass-generated.yaml"
}
