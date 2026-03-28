locals {
  queues = {
    "fraud-events"    = { delay = 0,  visibility = 30,  retention = 86400  }
    "payment-events"  = { delay = 0,  visibility = 30,  retention = 86400  }
    "booking-events"  = { delay = 0,  visibility = 60,  retention = 345600 }
    "fx-rates"        = { delay = 0,  visibility = 30,  retention = 3600   }
    "notifications"   = { delay = 0,  visibility = 30,  retention = 86400  }
  }
}

# Dead-letter queues — one per main queue
resource "aws_sqs_queue" "dlq" {
  for_each = local.queues

  name                       = "${var.project}-${var.environment}-${each.key}-dlq"
  message_retention_seconds  = 1209600 # 14 days
  kms_master_key_id          = var.kms_key_id

  tags = merge(var.common_tags, {
    Name  = "${var.project}-${var.environment}-${each.key}-dlq"
    Queue = each.key
  })
}

resource "aws_sqs_queue" "main" {
  for_each = local.queues

  name                       = "${var.project}-${var.environment}-${each.key}"
  delay_seconds              = each.value.delay
  visibility_timeout_seconds = each.value.visibility
  message_retention_seconds  = each.value.retention
  kms_master_key_id          = var.kms_key_id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 3
  })

  tags = merge(var.common_tags, {
    Name  = "${var.project}-${var.environment}-${each.key}"
    Queue = each.key
  })
}

# Queue policy — allow EKS service accounts (via IRSA) to send/receive
resource "aws_sqs_queue_policy" "main" {
  for_each  = aws_sqs_queue.main
  queue_url = each.value.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowEKSServiceAccounts"
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${var.aws_account_id}:root"
      }
      Action = [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ]
      Resource = each.value.arn
    }]
  })
}

