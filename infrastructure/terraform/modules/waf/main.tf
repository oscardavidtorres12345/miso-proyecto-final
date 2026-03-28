resource "aws_wafv2_web_acl" "travelhub" {
  name  = "${var.project}-${var.environment}-waf"
  scope = "REGIONAL" # attach to ALB; use CLOUDFRONT if fronting CF

  default_action {
    allow {}
  }

  # AWS Managed Rules — Core rule set (OWASP Top 10)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSCommonRules"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules — Known bad inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSKnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting — 2000 req / 5 min per IP
  rule {
    name     = "RateLimitPerIP"
    priority = 30

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitPerIP"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.project}-${var.environment}-waf"
  })
}

# Associate WAF with the ALB (done after ALB is created via association resource)
resource "aws_wafv2_web_acl_logging_configuration" "travelhub" {
  count                   = var.log_group_arn != "" ? 1 : 0
  resource_arn            = aws_wafv2_web_acl.travelhub.arn
  log_destination_configs = [var.log_group_arn]
}

