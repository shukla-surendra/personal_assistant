terraform {
  required_version = ">= 1.9.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      # Learning cluster: allow a real `terraform destroy` to actually
      # remove the vault immediately, rather than leaving a 90-day
      # soft-delete tombstone that blocks recreating the same name later.
      purge_soft_delete_on_destroy = true
    }
  }
}
