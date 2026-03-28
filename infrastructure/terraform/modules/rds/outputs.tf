output "endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = aws_db_instance.travelhub.endpoint
}

output "address" {
  description = "RDS hostname"
  value       = aws_db_instance.travelhub.address
}

output "port" {
  value = aws_db_instance.travelhub.port
}

output "identifier" {
  value = aws_db_instance.travelhub.identifier
}

output "security_group_id" {
  value = aws_security_group.rds.id
}

output "secret_arns" {
  description = "Map of database name → Secrets Manager ARN"
  value       = { for k, v in aws_secretsmanager_secret.db : k => v.arn }
}

