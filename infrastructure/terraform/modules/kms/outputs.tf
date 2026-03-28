output "key_id" {
  value = aws_kms_key.travelhub.key_id
}

output "key_arn" {
  value = aws_kms_key.travelhub.arn
}

output "alias_arn" {
  value = aws_kms_alias.travelhub.arn
}

