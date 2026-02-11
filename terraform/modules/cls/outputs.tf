output "logset_id" {
  description = "생성된 로그셋 ID"
  value       = tencentcloud_cls_logset.logset.id
}

output "app_topic_id" {
  description = "앱 로그 토픽 ID"
  value       = tencentcloud_cls_topic.app_logs.id
}

output "api_topic_id" {
  description = "API 로그 토픽 ID"
  value       = tencentcloud_cls_topic.api_logs.id
}