terraform {
  backend "cos" {
    region = "ap-seoul"
    bucket = "tf-state-quizdive-1403102014"
    prefix = "terraform/state/prod"  # dev와 다른 경로!
    encrypt = true
  }
}