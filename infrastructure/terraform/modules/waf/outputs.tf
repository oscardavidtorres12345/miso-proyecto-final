output "web_acl_arn" {
  description = "WAF Web ACL ARN — use this to associate with the ALB ingress annotation"
  value       = aws_wafv2_web_acl.travelhub.arn
}

output "web_acl_id" {
  value = aws_wafv2_web_acl.travelhub.id
}

