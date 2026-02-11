output "bucket_id" {
  description = "생성된 버킷 ID"
  value       = tencentcloud_cos_bucket.bucket.id
}

output "bucket_url" {
  description = "버킷 접근 URL"
  value       = "https://${tencentcloud_cos_bucket.bucket.bucket}.cos.${var.region}.myqcloud.com"
}

output "bucket_name_full" {
  description = "AppId가 포함된 전체 버킷명"
  value       = tencentcloud_cos_bucket.bucket.bucket
}

