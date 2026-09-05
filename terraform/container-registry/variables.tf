variable "resource_group_name" {
  description = "The ONE resource group for the whole project -- created here because this is the stage that always applies first and is never casually torn down mid-week. Every other stage (aks-infra, keyvault, application) reads this same RG via a `data \"azurerm_resource_group\"` block instead of creating its own, so there's a single RG in the subscription rather than one-per-stage. ACR still survives an AKS teardown/recreate -- not via RG isolation anymore, but because aks-infra's `terraform destroy` only touches resources ITS OWN state manages (a `data` source is read-only; destroying the state that reads it can't delete the real resource behind it)."
  type        = string
  default     = "personal-assistant-learning"
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "acr_name" {
  description = "Must be globally unique across ALL of Azure, alphanumeric only, no hyphens. Default appends a random suffix at apply time."
  type        = string
  default     = null
}
