data "azurerm_client_config" "current" {}

resource "random_string" "kv_suffix" {
  length  = 6
  special = false
  upper   = false
}

# enable_rbac_authorization = true -- Azure RBAC role assignments (identity
# + role definition + scope, same 3-tuple as every other role_assignment in
# this project), not the older vault access-policy model. Two different
# permission systems Azure happens to support for the same resource; this
# project has been RBAC-only throughout (see docs/AWS_vs_AZURE_PERMISSIONS.md)
# so the vault stays consistent with that rather than introducing a second
# permission model just for itself.
resource "azurerm_key_vault" "this" {
  name                       = var.key_vault_name != null ? var.key_vault_name : "pa-kv-${random_string.kv_suffix.result}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  rbac_authorization_enabled = true
  purge_protection_enabled   = false # learning vault -- see versions.tf's purge_soft_delete_on_destroy

  tags = {
    purpose = "personal-assistant-learning"
  }
}

# A dedicated identity for the backend workload only -- not the AKS
# cluster's own SystemAssigned identity (that one's job is running the
# cluster itself and pulling images via kubelet, see aks-infra's
# azurerm_role_assignment.aks_acr_pull), and not a shared identity across
# every pod in the cluster. Same least-privilege-per-component shape as
# terraform/cicd's GitHub Actions identity.
resource "azurerm_user_assigned_identity" "backend" {
  name                = "personal-assistant-backend-identity"
  resource_group_name = var.resource_group_name
  location            = var.location
}

# Trusts a Kubernetes ServiceAccount token as this Azure AD identity --
# the Workload Identity equivalent of terraform/cicd's federated credential
# for GitHub Actions, just with AKS's own OIDC issuer instead of GitHub's,
# and a K8s ServiceAccount subject instead of a repo+branch subject. No
# client secret stored anywhere either way.
resource "azurerm_federated_identity_credential" "backend" {
  name                      = "personal-assistant-backend-sa"
  user_assigned_identity_id = azurerm_user_assigned_identity.backend.id
  audience                  = ["api://AzureADTokenExchange"]
  issuer                    = var.oidc_issuer_url
  subject                   = "system:serviceaccount:${var.backend_service_account_namespace}:${var.backend_service_account_name}"
}

# Key Vault Secrets User only -- can read secret VALUES, nothing else.
# Can't create/delete/list-all secrets, can't touch access policies, can't
# manage the vault itself. Same least-privilege shape as CI's AcrPush-only
# role (terraform/cicd/main.tf) -- this identity's entire job is reading
# one secret at pod-start time.
resource "azurerm_role_assignment" "backend_kv_secrets_user" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.backend.principal_id
}

# RBAC-mode Key Vault has no implicit "creator gets access" the way the
# legacy access-policy model did -- without this, not even the identity
# that just ran `terraform apply` could read or write a secret into the
# vault it just created. Secrets Officer (not Administrator) -- can
# read/write/delete secret values, can't touch the vault's own access
# control or purge-protection settings.
resource "azurerm_role_assignment" "deployer_kv_secrets_officer" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}
