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
  description = "Tag pushed to ACR for the backend image (see README.md's build/push steps, or scripts/build-and-push.sh). \"latest\" was the default here originally but was never actually the tag scripts/build-and-push.sh pushes (that defaults to v1) -- a real mismatch that briefly deployed a nonexistent image tag once. v1 matches what actually exists in the registry unless you've pushed something else."
  type        = string
  default     = "v1"
}

variable "frontend_image_tag" {
  type    = string
  default = "v1"
}

variable "backend_workload_identity_client_id" {
  description = "From the keyvault stage's output: terraform -chdir=../keyvault output -raw backend_identity_client_id. Empty means no Key Vault at all (e.g. minikube) -- the chart falls back to secrets.openaiApiKey below, which stays empty -> chat's /completion endpoint returns a clean 503 rather than crashing."
  type        = string
  default     = ""
}

variable "key_vault_name" {
  description = "From the keyvault stage's output: terraform -chdir=../keyvault output -raw key_vault_name"
  type        = string
  default     = ""
}

variable "azure_tenant_id" {
  description = "From the keyvault stage's output: terraform -chdir=../keyvault output -raw tenant_id"
  type        = string
  default     = ""
}

variable "backend_storage_account_url" {
  description = "From the keyvault stage's output: terraform -chdir=../keyvault output -raw storage_account_blob_endpoint. Empty means no avatar upload storage available (e.g. minikube) -- the backend simply has no AZURE_STORAGE_ACCOUNT_URL/AZURE_STORAGE_CONNECTION_STRING set there, so the avatar endpoint would fail if called; nothing else in the app depends on it."
  type        = string
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
