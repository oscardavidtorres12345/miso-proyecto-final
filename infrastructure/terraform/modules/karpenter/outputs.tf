output "controller_role_arn" {
  description = "ARN of the Karpenter controller IAM role (for IRSA)"
  value       = aws_iam_role.karpenter_controller.arn
}

output "node_role_name" {
  description = "Name of the Karpenter node IAM role"
  value       = aws_iam_role.karpenter_node.name
}

output "node_instance_profile_name" {
  description = "Name of the Karpenter node instance profile"
  value       = aws_iam_instance_profile.karpenter_node.name
}

output "interruption_queue_name" {
  description = "Name of the SQS queue for spot interruption handling"
  value       = aws_sqs_queue.karpenter_interruption.name
}

output "interruption_queue_arn" {
  description = "ARN of the SQS queue for spot interruption handling"
  value       = aws_sqs_queue.karpenter_interruption.arn
}

output "ec2nodeclass_generated_path" {
  description = "Path to the generated EC2NodeClass YAML with dynamic values from Terraform"
  value       = local_file.ec2nodeclass_rendered.filename
}
