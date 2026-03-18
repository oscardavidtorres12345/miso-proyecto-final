resource "aws_ecr_repository" "payment_service" {
  name                 = "travelhub/payment-service"
  image_tag_mutability = "MUTABLE"
  force_delete         = true   # permite destruir el repo aunque tenga imágenes

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "travelhub-poc"
    Environment = var.environment
  }
}

# Política de ciclo de vida: mantener solo las últimas 5 imágenes
resource "aws_ecr_lifecycle_policy" "payment_service" {
  repository = aws_ecr_repository.payment_service.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Mantener las últimas 5 imágenes"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

