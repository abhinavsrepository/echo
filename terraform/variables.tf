variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "echo"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production"
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "dashboard_container_image" {
  description = "Dashboard container image"
  type        = string
}

variable "workers_container_image" {
  description = "Workers container image"
  type        = string
}

variable "dashboard_desired_count" {
  description = "Desired number of dashboard tasks"
  type        = number
  default     = 2
}

variable "workers_desired_count" {
  description = "Desired number of worker tasks"
  type        = number
  default     = 1
}

variable "dashboard_cpu" {
  description = "Dashboard task CPU units"
  type        = number
  default     = 512
}

variable "dashboard_memory" {
  description = "Dashboard task memory (MB)"
  type        = number
  default     = 1024
}

variable "workers_cpu" {
  description = "Workers task CPU units"
  type        = number
  default     = 256
}

variable "workers_memory" {
  description = "Workers task memory (MB)"
  type        = number
  default     = 512
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "echo_analytics"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "echo_admin"
  sensitive   = true
}

variable "enable_cdn" {
  description = "Enable CloudFront CDN"
  type        = bool
  default     = true
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 1
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
