output "primary_endpoint" {
  description = "Redis primary endpoint address"
  value       = aws_elasticache_replication_group.travelhub.primary_endpoint_address
}

output "port" {
  value = 6379
}

output "security_group_id" {
  value = aws_security_group.redis.id
}

output "replication_group_id" {
  value = aws_elasticache_replication_group.travelhub.id
}

