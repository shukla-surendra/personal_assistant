variable "resource_group_name" {
  description = "Must match the aks-infra stage's resource_group_name (default: personal-assistant-learning)."
  type        = string
  default     = "personal-assistant-learning"
}

variable "cluster_name" {
  description = "Must match the aks-infra stage's cluster_name."
  type        = string
  default     = "personal-assistant-aks"
}

variable "acr_login_server" {
  description = "From container-registry's output: terraform -chdir=../container-registry output -raw acr_login_server"
  type        = string
}

variable "backend_image_tag" {
  description = "Tag pushed to ACR for the backend image (see README.md's build/push steps)."
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  type    = string
  default = "latest"
}

variable "openai_api_key" {
  description = "Leave empty to deploy without one -- chat's /completion endpoint returns a clean 503 rather than crashing."
  type        = string
  sensitive   = true
  default     = ""
}

variable "postgres_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  description = "Signs auth tokens (config.py's jwt_secret field). Generate with: openssl rand -hex 32"
  type        = string
  sensitive   = true
}
