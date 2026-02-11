variable "logset_name" {
  description = "로그셋 이름"
  type        = string
}

variable "retention_days" {
  description = "로그 보관 기간 (일)"
  type        = number
  default     = 7
}

variable "tags" {
  description = "리소스 태그"
  type        = map(string)
  default     = {}
}