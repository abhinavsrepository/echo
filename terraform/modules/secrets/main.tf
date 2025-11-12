resource "aws_secretsmanager_secret" "db_password" {
  name       = "${var.name_prefix}/db-password"
  kms_key_id = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "convex_deployment" {
  name       = "${var.name_prefix}/convex-deployment"
  kms_key_id = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret" "clerk_secret_key" {
  name       = "${var.name_prefix}/clerk-secret-key"
  kms_key_id = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret" "database_url" {
  name       = "${var.name_prefix}/database-url"
  kms_key_id = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret" "openai_api_key" {
  name       = "${var.name_prefix}/openai-api-key"
  kms_key_id = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret" "anthropic_api_key" {
  name       = "${var.name_prefix}/anthropic-api-key"
  kms_key_id = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret" "pinecone_api_key" {
  name       = "${var.name_prefix}/pinecone-api-key"
  kms_key_id = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret" "vapi_api_key" {
  name       = "${var.name_prefix}/vapi-api-key"
  kms_key_id = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret" "redis_url" {
  name       = "${var.name_prefix}/redis-url"
  kms_key_id = var.kms_key_id

  tags = var.tags
}
