# terraform/versions.tf
terraform {
  required_version = ">= 1.7.0"

  required_providers {
    tencentcloud = {
      source  = "tencentcloudstack/tencentcloud"
      version = "~> 1.81"  # 마이너 버전 업데이트만 허용
    }
  }
}