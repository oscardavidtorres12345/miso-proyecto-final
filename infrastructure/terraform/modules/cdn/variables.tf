variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "elb_dns_name" {
  type        = string
  description = "DNS name of the ELB (nginx ingress) to use as CloudFront origin"
}

variable "common_tags" {
  type    = map(string)
  default = {}
}

