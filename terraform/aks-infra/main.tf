resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    purpose = "personal-assistant-learning"
  }
}

# A real VNet rather than AKS's auto-managed default -- this is the same
# VNet mental model from the Azure track's VNet module (platform-lab/
# cloud-practice/azure/docs/vnet/architecture.md), applied for real instead
# of staying theoretical.
resource "azurerm_virtual_network" "this" {
  name                = "${var.cluster_name}-vnet"
  address_space       = ["10.10.0.0/16"]
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
}

resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.this.name
  virtual_network_name = azurerm_virtual_network.this.name
  address_prefixes     = ["10.10.1.0/24"]
}

# Optional -- off by default (enable_container_insights). Log Analytics
# ingestion is the real cost driver in most people's first "why is my AKS
# bill higher than expected" story, so this stays a deliberate opt-in.
resource "azurerm_log_analytics_workspace" "this" {
  count               = var.enable_container_insights ? 1 : 0
  name                = "${var.cluster_name}-logs"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_kubernetes_cluster" "this" {
  name                = var.cluster_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  dns_prefix          = var.cluster_name
  kubernetes_version  = var.kubernetes_version

  # Free tier: $0 for the control plane, no uptime SLA. Standard tier costs
  # ~$0.10/hour (~$73/month) purely for an SLA a one-week learning cluster
  # has no use for.
  sku_tier = "Free"

  default_node_pool {
    name           = "system"
    node_count     = var.node_count
    vm_size        = var.node_vm_size
    vnet_subnet_id = azurerm_subnet.aks.id
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    # kubenet over Azure CNI: kubenet allocates pod IPs from a separate
    # overlay range instead of consuming one VNet IP per pod, which matters
    # on a /24 subnet with only 2-3 nodes. Azure CNI is the more "real
    # production" choice (pods get real VNet-routable IPs) but isn't needed
    # for a learning deployment this small.
    network_plugin    = "kubenet"
    load_balancer_sku = "standard" # AKS no longer supports Basic for new clusters anyway --
    # named explicitly so the ~$18/month LB cost isn't a surprise.
  }

  dynamic "oms_agent" {
    for_each = var.enable_container_insights ? [1] : []
    content {
      log_analytics_workspace_id = azurerm_log_analytics_workspace.this[0].id
    }
  }

  tags = {
    purpose = "personal-assistant-learning"
  }
}

# Lets the AKS cluster's node identity pull images from the ACR created by
# the separate container-registry/ stage (var.acr_id, its output) --
# without admin credentials or an imagePullSecret. This is the only place
# the two stages' resources actually touch, which is exactly why ACR
# surviving an `aks-infra` destroy/recreate works: nothing here *creates*
# or *owns* the registry, it only references it by ID.
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.this.kubelet_identity[0].object_id
}

# Budget + email alert -- the actual point of this block, given the $200
# constraint. Azure evaluates this against ACTUAL + FORECASTED cost for the
# whole resource group, so it can warn you before you're already over.
resource "azurerm_consumption_budget_resource_group" "this" {
  name              = "${var.cluster_name}-weekly-learning-budget"
  resource_group_id = azurerm_resource_group.this.id

  amount     = var.budget_amount_usd
  time_grain = "Monthly"

  time_period {
    start_date = "2026-09-01T00:00:00Z"
    end_date   = "2028-09-01T00:00:00Z" # generous; the budget just keeps re-evaluating monthly until this
  }

  notification {
    enabled        = true
    threshold      = 50.0
    operator       = "GreaterThan"
    contact_emails = [var.budget_alert_email]
  }

  notification {
    enabled        = true
    threshold      = 80.0
    operator       = "GreaterThan"
    contact_emails = [var.budget_alert_email]
  }

  notification {
    enabled        = true
    threshold      = 100.0
    operator       = "GreaterThan"
    contact_emails = [var.budget_alert_email]
  }
}
