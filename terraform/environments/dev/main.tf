# 변수 정의
variable "region" { 
  default = "ap-seoul" 
}
variable "tencent_secret_id" {
  description = "환경변수 TF_VAR_tencent_secret_id로 주입"
  sensitive   = true
}
variable "tencent_secret_key" {
  description = "환경변수 TF_VAR_tencent_secret_key로 주입"
  sensitive   = true
}

# Provider 설정
terraform {
  required_version = ">= 1.7.0"
  required_providers {
    tencentcloud = {
      source  = "tencentcloudstack/tencentcloud"
      version = "~> 1.81"
    }
  }
}

provider "tencentcloud" {
  region     = var.region
  secret_id  = var.tencent_secret_id
  secret_key = var.tencent_secret_key
}

# AppId 자동 조회 (Tencent 계정마다 고유)
data "tencentcloud_user_info" "current" {}

# ===== 모듈 사용 =====

module "cos" {
  source = "../../modules/cos"
  
  appid           = data.tencentcloud_user_info.current.app_id
  bucket_name     = "quizdive-images-dev"
  region          = var.region
  allowed_origins = ["http://localhost:3000", "https://quiz.jungyu.store"]
  retention_days  = 7  # 개발 환경은 7일만 보관
  tags = {
    ServiceName = "QuizDive"
    Env         = "dev"
    Tool        = "Terraform"
    TestTag     = "CICD-Verification"
  }
}

module "cls" {
  source = "../../modules/cls"
  
  logset_name    = "quizdive-logs-dev"
  retention_days = 3  # 개발 환경은 3일만 보관 (비용 절감)
  tags = {
    ServiceName = "QuizDive"
    Env         = "dev"
    Tool        = "Terraform"
    TestTag     = "CICD-Verification"
  }
}

# 출력값 (배포 후 확인용)
output "cos_bucket_url" {
  value = module.cos.bucket_url
}

output "cls_logset_id" {
  value = module.cls.logset_id
}