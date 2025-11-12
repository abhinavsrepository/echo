terraform {
  backend "s3" {
    bucket         = "echo-terraform-state"
    key            = "echo/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "echo-terraform-locks"
    kms_key_id     = "alias/terraform-state"
  }

  required_version = "~> 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Echo"
      Environment = terraform.workspace
      ManagedBy   = "Terraform"
    }
  }
}
