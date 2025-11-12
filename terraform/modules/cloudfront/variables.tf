variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "alb_domain_name" {
  description = "ALB domain name"
  type        = string
}

variable "s3_assets_bucket_id" {
  description = "S3 assets bucket ID"
  type        = string
}

variable "s3_assets_domain" {
  description = "S3 assets bucket domain"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Custom domain name"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
