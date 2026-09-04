variable "resource_group_name" {
  description = "Deliberately its OWN resource group, separate from aks-infra's -- the whole point of this stage is that ACR survives an AKS cluster teardown/recreate. If this lived in the same RG as the cluster, destroying that RG would take ACR (and every image in it) down with it, regardless of which Terraform state manages which resource."
  type        = string
  default     = "personal-assistant-registry"
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
