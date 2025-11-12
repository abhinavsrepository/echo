output "secrets_prefix" {
  description = "Secrets Manager prefix for ARNs"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "db_password_arn" {
  description = "Database password secret ARN"
  value       = aws_secretsmanager_secret.db_password.arn
}
