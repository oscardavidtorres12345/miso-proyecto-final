output "queue_urls" {
  description = "Map of queue name → URL"
  value       = { for k, v in aws_sqs_queue.main : k => v.id }
}

output "queue_arns" {
  description = "Map of queue name → ARN"
  value       = { for k, v in aws_sqs_queue.main : k => v.arn }
}

output "dlq_arns" {
  description = "Map of DLQ name → ARN"
  value       = { for k, v in aws_sqs_queue.dlq : k => v.arn }
}

