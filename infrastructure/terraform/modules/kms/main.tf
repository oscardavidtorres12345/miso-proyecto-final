data "aws_caller_identity" "current" {}

resource "aws_kms_key" "travelhub" {
  description             = "TravelHub — encrypts RDS, ElastiCache and Secrets Manager"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRootFullControl"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowRDSService"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
          "kms:GenerateDataKey*", "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-kms"
  })
}

resource "aws_kms_alias" "travelhub" {
  name          = "alias/${var.project}-${var.environment}"
  target_key_id = aws_kms_key.travelhub.key_id
}

