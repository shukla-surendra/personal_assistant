variable "resource_group_name" {
  description = "Name of the resource group to create."
  type        = string
  default     = "custom-tf-learning-rg"
}

variable "location" {
  description = "Azure region."
  type        = string
  default     = "eastus"
}

variable "storage_account_name" {
  description = "Lowercase letters and digits only, 3-24 chars, and must be globally unique across ALL of Azure (not just your subscription) -- pick something distinctive, not a generic word."
  type        = string
  default     = "customtflearning001"
}