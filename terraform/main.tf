locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = var.project_name
  })
}

module "kms" {
  source = "./modules/kms"

  name_prefix = local.name_prefix
  tags        = local.common_tags
}

module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  cidr_block         = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = local.common_tags
}

module "iam" {
  source = "./modules/iam"

  name_prefix       = local.name_prefix
  kms_key_arn       = module.kms.key_arn
  s3_documents_arn  = module.s3.documents_bucket_arn
  s3_assets_arn     = module.s3.assets_bucket_arn
  secrets_name_prefix = "${local.name_prefix}/*"
  tags              = local.common_tags
}

module "s3" {
  source = "./modules/s3"

  name_prefix     = local.name_prefix
  kms_key_id      = module.kms.key_id
  enable_versioning = var.enable_backup
  tags            = local.common_tags
}

module "rds" {
  source = "./modules/rds"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  database_name         = var.db_name
  master_username       = var.db_username
  kms_key_id            = module.kms.key_id
  backup_retention_days = var.backup_retention_days
  enable_backup         = var.enable_backup
  tags                  = local.common_tags
}

module "secrets" {
  source = "./modules/secrets"

  name_prefix = local.name_prefix
  kms_key_id  = module.kms.key_id
  db_password = module.rds.db_password
  tags        = local.common_tags
}

module "alb" {
  source = "./modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.public_subnet_ids
  certificate_arn   = var.certificate_arn
  tags              = local.common_tags
}

module "ecs_cluster" {
  source = "./modules/ecs-cluster"

  name_prefix = local.name_prefix
  tags        = local.common_tags
}

resource "aws_ecs_task_definition" "dashboard" {
  family                   = "${local.name_prefix}-dashboard"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.dashboard_cpu
  memory                   = var.dashboard_memory
  execution_role_arn       = module.iam.task_execution_role_arn
  task_role_arn            = module.iam.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "dashboard"
      image     = var.dashboard_container_image
      essential = true
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" }
      ]
      secrets = [
        {
          name      = "CONVEX_DEPLOYMENT"
          valueFrom = "${module.secrets.secrets_prefix}/convex-deployment"
        },
        {
          name      = "CLERK_SECRET_KEY"
          valueFrom = "${module.secrets.secrets_prefix}/clerk-secret-key"
        },
        {
          name      = "DATABASE_URL"
          valueFrom = "${module.secrets.secrets_prefix}/database-url"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${local.name_prefix}-dashboard"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_service" "dashboard" {
  name            = "${local.name_prefix}-dashboard"
  cluster         = module.ecs_cluster.cluster_id
  task_definition = aws_ecs_task_definition.dashboard.arn
  desired_count   = var.dashboard_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnet_ids
    security_groups  = [aws_security_group.dashboard.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = module.alb.target_group_arn
    container_name   = "dashboard"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  enable_execute_command = true

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "workers" {
  family                   = "${local.name_prefix}-workers"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.workers_cpu
  memory                   = var.workers_memory
  execution_role_arn       = module.iam.task_execution_role_arn
  task_role_arn            = module.iam.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "workers"
      image     = var.workers_container_image
      essential = true
      environment = [
        { name = "NODE_ENV", value = "production" }
      ]
      secrets = [
        {
          name      = "REDIS_URL"
          valueFrom = "${module.secrets.secrets_prefix}/redis-url"
        },
        {
          name      = "CONVEX_DEPLOYMENT"
          valueFrom = "${module.secrets.secrets_prefix}/convex-deployment"
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = "${module.secrets.secrets_prefix}/openai-api-key"
        },
        {
          name      = "PINECONE_API_KEY"
          valueFrom = "${module.secrets.secrets_prefix}/pinecone-api-key"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${local.name_prefix}-workers"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_service" "workers" {
  name            = "${local.name_prefix}-workers"
  cluster         = module.ecs_cluster.cluster_id
  task_definition = aws_ecs_task_definition.workers.arn
  desired_count   = var.workers_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnet_ids
    security_groups  = [aws_security_group.workers.id]
    assign_public_ip = false
  }

  enable_execute_command = true

  tags = local.common_tags
}

resource "aws_security_group" "dashboard" {
  name        = "${local.name_prefix}-dashboard"
  description = "Security group for dashboard service"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [module.alb.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-dashboard" })
}

resource "aws_security_group" "workers" {
  name        = "${local.name_prefix}-workers"
  description = "Security group for workers service"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-workers" })
}

resource "aws_cloudwatch_log_group" "dashboard" {
  name              = "/ecs/${local.name_prefix}-dashboard"
  retention_in_days = 30
  kms_key_id        = module.kms.key_arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "workers" {
  name              = "/ecs/${local.name_prefix}-workers"
  retention_in_days = 30
  kms_key_id        = module.kms.key_arn

  tags = local.common_tags
}

module "cloudfront" {
  count  = var.enable_cdn ? 1 : 0
  source = "./modules/cloudfront"

  name_prefix          = local.name_prefix
  alb_domain_name      = module.alb.alb_dns_name
  s3_assets_bucket_id  = module.s3.assets_bucket_id
  s3_assets_domain     = module.s3.assets_bucket_domain
  certificate_arn      = var.certificate_arn
  domain_name          = var.domain_name
  tags                 = local.common_tags
}
