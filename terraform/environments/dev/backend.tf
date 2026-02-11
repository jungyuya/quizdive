terraform {
  backend "cos" {
    region = "ap-seoul"
    bucket = "tf-state-quizdive-1403102014"  # Day 1에서 수동 생성한 버킷!
    prefix = "terraform/state/dev"         # 환경별 경로 분리
    encrypt = true                          # State 파일 암호화
  }
}