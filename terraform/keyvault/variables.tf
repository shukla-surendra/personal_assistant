variable "resource_group_name" {
  description = "Must match the aks-infra stage's resource_group_name -- the vault lives alongside the cluster, not in its own RG like container-registry does (ACR is deliberately separate so it survives an AKS teardown; this vault's only consumer IS the AKS workload, so there's no equivalent reason to isolate it)."
  type        = string
  default     = "personal-assistant-learning"
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "key_vault_name" {
  description = "Must be globally unique across ALL of Azure (part of the vault's DNS name, <name>.vault.azure.net) -- same constraint ACR's name has. Leave null to append a random suffix at apply time, same pattern as container-registry/main.tf's random_string.acr_suffix."
  type        = string
  default     = null
}

variable "oidc_issuer_url" {
  description = "From the aks-infra stage's output: terraform -chdir=../aks-infra output -raw oidc_issuer_url. This is what lets a Kubernetes ServiceAccount token be trusted as this Azure AD identity -- the federated_identity_credential's issuer."
  type        = string
}

variable "backend_service_account_namespace" {
  description = "Must match wherever the personal-assistant Helm release is installed. The federated credential's subject is scoped to this exact namespace+name pair -- get either wrong and Azure AD rejects the token exchange with no ambiguity about why."
  type        = string
  default     = "default"
}

variable "backend_service_account_name" {
  description = "Must match the ServiceAccount name the Helm chart creates for the backend pod (helm/personal-assistant/templates/serviceaccount-backend.yaml uses `{{ include \"pa.fullname\" . }}-backend`, i.e. \"personal-assistant-backend\" with the chart's default release name)."
  type        = string
  default     = "personal-assistant-backend"
}
