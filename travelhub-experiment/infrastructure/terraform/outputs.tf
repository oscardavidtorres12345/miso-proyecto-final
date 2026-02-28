output "cluster_name" {
  description = "Nombre del cluster EKS"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint del API server del cluster"
  value       = module.eks.cluster_endpoint
}

output "cluster_region" {
  description = "Región donde está el cluster"
  value       = var.aws_region
}

output "ecr_repository_url" {
  description = "URL del repositorio ECR para el payment-service"
  value       = aws_ecr_repository.payment_service.repository_url
}

output "kubeconfig_command" {
  description = "Comando para configurar kubectl apuntando a este cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "ecr_login_command" {
  description = "Comando para autenticarse con ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

