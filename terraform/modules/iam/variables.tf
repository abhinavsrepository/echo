variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN"
  type        = string
}

variable "s3_documents_arn" {
  description = "S3 documents bucket ARN"
  type        = string
}

variable "s3_assets_arn" {
  description = "S3 assets bucket ARN"
  type        = string
}

variable "secrets_name_prefix" {
  description = "Secrets Manager name prefix pattern"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
