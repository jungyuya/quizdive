# Logset: 로그를 담는 큰 폴더
resource "tencentcloud_cls_logset" "logset" {
  logset_name = var.logset_name
  tags        = var.tags
}

# Topic: 로그를 분류하는 작은 폴더
resource "tencentcloud_cls_topic" "app_logs" {
  topic_name           = "${var.logset_name}-app"
  logset_id            = tencentcloud_cls_logset.logset.id
  auto_split           = true      # 파티션 자동 분할
  max_split_partitions = 50
  partition_count      = 1
  period               = var.retention_days  # 로그 보관 기간
  storage_type         = "hot"     # 자주 조회하는 로그
}

# API 호출 로그 전용 토픽 (선택)
resource "tencentcloud_cls_topic" "api_logs" {
  topic_name           = "${var.logset_name}-api"
  logset_id            = tencentcloud_cls_logset.logset.id
  auto_split           = true
  max_split_partitions = 50
  partition_count      = 1
  period               = var.retention_days
  storage_type         = "hot"
}