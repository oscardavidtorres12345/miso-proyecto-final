output "domain_name" {
  description = "CloudFront distribution domain name (xxxx.cloudfront.net)"
  value       = aws_cloudfront_distribution.travelhub.domain_name
}

output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.travelhub.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.travelhub.arn
}

