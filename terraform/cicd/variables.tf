variable "github_org" {
  type    = string
  default = "shukla-surendra"
}

variable "github_repo" {
  type    = string
  default = "personal_assistant"
}

variable "github_branch" {
  description = "Which branch's workflow runs are trusted to authenticate as this identity. GitHub's OIDC subject claim for a workflow_dispatch (manual) run is scoped to the ref it's dispatched against -- main here."
  type        = string
  default     = "main"
}

variable "acr_id" {
  description = "From container-registry's output: terraform -chdir=../container-registry output -raw acr_id"
  type        = string
}
