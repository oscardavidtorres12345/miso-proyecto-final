resource "aws_elasticache_subnet_group" "travelhub" {
  name       = "${var.project}-${var.environment}-redis-subnet"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-redis-subnet"
  })
}

resource "aws_security_group" "redis" {
  name        = "${var.project}-${var.environment}-redis-sg"
  description = "Allow Redis from EKS nodes only"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.eks_node_security_group_id != null ? [var.eks_node_security_group_id] : []
    content {
      description     = "Redis from EKS node SG"
      from_port       = 6379
      to_port         = 6379
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-redis-sg"
  })
}

resource "aws_elasticache_replication_group" "travelhub" {
  replication_group_id = "${var.project}-${var.environment}-redis"
  description          = "TravelHub Redis - booking-service cache"

  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_clusters
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.travelhub.name
  security_group_ids = [aws_security_group.redis.id]

  engine_version          = var.engine_version
  parameter_group_name    = "default.redis7"
  automatic_failover_enabled = var.num_cache_clusters > 1

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.auth_token

  snapshot_retention_limit = 1

  apply_immediately = true

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-redis"
  })
}

