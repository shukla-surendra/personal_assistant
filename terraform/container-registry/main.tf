resource "random_string" "acr_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    purpose = "personal-assistant-learning"
  }
}

resource "azurerm_container_registry" "this" {
  name                = var.acr_name != null ? var.acr_name : "personalassistant${random_string.acr_suffix.result}"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  sku                 = "Basic" # cheapest tier (~$0.167/day); Standard/Premium add geo-replication and
  # throughput this single-learner deployment has no use for.
  admin_enabled = false # pulled via role assignment (AKS kubelet's Managed Identity, granted in
  # aks-infra/), not admin username/password.
}
