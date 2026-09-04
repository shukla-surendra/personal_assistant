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

  # Local state for a one-week learning cluster -- fine as long as this
  # directory isn't shared/collaborated on. For anything longer-lived, move
  # this to an azurerm backend (a storage account + container), which is
  # exactly the kind of thing worth doing as a *second* learning exercise
  # once this one's torn down.
}

provider "azurerm" {
  features {
    resource_group {
      # Lets `terraform destroy` remove the resource group even if it still
      # has resources Terraform doesn't know about (e.g. something created
      # by hand while poking around in the portal during the week).
      prevent_deletion_if_contains_resources = false
    }
  }
}
