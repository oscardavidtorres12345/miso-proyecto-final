resource "aws_db_subnet_group" "travelhub" {
  name       = "${var.project}-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-db-subnet"
  })
}

resource "aws_security_group" "rds" {
  name        = "${var.project}-${var.environment}-rds-sg"
  description = "Allow PostgreSQL from EKS nodes only"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.eks_node_security_group_id != null ? [var.eks_node_security_group_id] : []
    content {
      description     = "PostgreSQL from EKS node SG"
      from_port       = 5432
      to_port         = 5432
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
    Name = "${var.project}-${var.environment}-rds-sg"
  })
}

resource "aws_db_instance" "travelhub" {
  identifier = "${var.project}-${var.environment}-postgres"

  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.instance_class

  # Storage
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = var.kms_key_arn

  # Credentials — stored in Secrets Manager separately
  db_name  = "postgres" # default DB; per-service DBs created via provisioner
  username = var.db_username
  password = var.db_password

  # Network
  db_subnet_group_name   = aws_db_subnet_group.travelhub.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = var.multi_az

  # Maintenance
  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "${var.project}-${var.environment}-final" : null

  # Performance Insights (free tier: 7 days)
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  apply_immediately = true

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-postgres"
  })
}

# One Secrets Manager secret per database so each service gets its own creds
resource "aws_secretsmanager_secret" "db" {
  for_each = toset(var.databases)

  name                    = "${var.project}/${var.environment}/db/${each.key}"
  recovery_window_in_days = 0 # allow immediate re-creation in dev

  tags = merge(var.common_tags, {
    Service = each.key
  })
}

resource "aws_secretsmanager_secret_version" "db" {
  for_each  = aws_secretsmanager_secret.db
  secret_id = each.value.id

  secret_string = jsonencode({
    host     = aws_db_instance.travelhub.address
    port     = aws_db_instance.travelhub.port
    dbname   = each.key
    username = var.db_username
    password = var.db_password
    url      = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.travelhub.address}:${aws_db_instance.travelhub.port}/${each.key}"
  })
}

