variable "resource_group_name" {
  description = "Must match the container-registry stage's resource_group_name -- the one shared RG for the whole project. The vault lives here too, same as everything else; it's this stage's own Terraform state (not RG placement) that keeps it isolated from an aks-infra teardown -- destroying aks-infra only removes what ITS state manages, never this vault."
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

variable "storage_account_name" {
  description = "Must be globally unique across ALL of Azure, 3-24 lowercase-alphanumeric-only characters (Storage Account naming rules, stricter than the Key Vault/ACR name constraints). Leave null to append the same random suffix the vault uses."
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

variable "keda_namespace" {
  description = "Must match the namespace terraform/application's helm_release.keda installs into."
  type        = string
  default     = "keda"
}

variable "keda_service_account_name" {
  description = "Must match the kedacore/keda chart's serviceAccount.operator.name (default \"keda-operator\" -- not overridden anywhere in this project, see terraform/application/main.tf)."
  type        = string
  default     = "keda-operator"
}
