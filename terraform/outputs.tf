output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = module.alb.alb_zone_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = var.enable_cdn ? module.cloudfront[0].cloudfront_domain_name : null
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = var.enable_cdn ? module.cloudfront[0].cloudfront_distribution_id : null
}

output "s3_documents_bucket" {
  description = "S3 bucket for documents"
  value       = module.s3.documents_bucket_name
}

output "s3_assets_bucket" {
  description = "S3 bucket for static assets"
  value       = module.s3.assets_bucket_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs_cluster.cluster_name
}

output "dashboard_service_name" {
  description = "Dashboard service name"
  value       = aws_ecs_service.dashboard.name
}

output "workers_service_name" {
  description = "Workers service name"
  value       = aws_ecs_service.workers.name
}

output "secrets_kms_key_id" {
  description = "KMS key ID for secrets"
  value       = module.kms.key_id
}

output "secrets_kms_key_arn" {
  description = "KMS key ARN for secrets"
  value       = module.kms.key_arn
}

output "iam_task_execution_role_arn" {
  description = "IAM task execution role ARN"
  value       = module.iam.task_execution_role_arn
}

output "iam_task_role_arn" {
  description = "IAM task role ARN"
  value       = module.iam.task_role_arn
}
