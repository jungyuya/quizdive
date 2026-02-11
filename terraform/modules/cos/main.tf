resource "tencentcloud_cos_bucket" "bucket" {
  # 버킷명 형식: {사용자정의이름}-{appid}
  # appid는 Tencent Cloud 계정마다 고유한 숫자
  bucket = "${var.bucket_name}-${var.appid}"
  acl    = "private"  # 공개 접근 차단
  
  # 버전 관리: 실수로 삭제해도 복구 가능
  versioning_enable = true
  
  # 생명주기 정책: 30일 후 자동 삭제 (비용 절감)
  lifecycle_rules {
    filter_prefix = ""
    expiration {
      days = var.retention_days
    }
  }
  
  # CORS: 웹 브라우저에서 직접 업로드 허용
  cors_rules {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "HEAD", "DELETE"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag", "Content-Length"]
    max_age_seconds = 3600
  }

  tags = var.tags
}