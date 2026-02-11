variable "appid" {
  description = "Tencent Cloud Account AppId (자동 조회)"
  type        = string
}

variable "bucket_name" {
  description = "버킷 이름 (예: quizdive-images)"
  type        = string
}

variable "allowed_origins" {
  description = "CORS 허용 도메인 목록"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "retention_days" {
  description = "이미지 보존 기간 (일)"
  type        = number
  default     = 30
}

variable "tags" {
  description = "리소스 태그"
  type        = map(string)
  default     = {}
}

variable "region" {
  description = "Tencent Cloud 리전"
  type        = string
  default     = "ap-seoul"
}