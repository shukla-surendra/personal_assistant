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

# A SECOND federated credential on the SAME identity, trusting a totally
# different ServiceAccount (KEDA's own operator, not the backend pod's).
# One Azure AD identity can have multiple federated credentials, each
# trusting a different K8s subject -- this is what lets KEDA poll the
# queue AS this identity (same role assignment below, reused) without
# a second identity or any stored credential. Namespace/name match the
# kedacore/keda chart's default serviceAccount.operator.name -- see
# terraform/application/main.tf's helm_release.keda.
resource "azurerm_federated_identity_credential" "keda" {
  name                      = "personal-assistant-keda-operator"
  user_assigned_identity_id = azurerm_user_assigned_identity.backend.id
  audience                  = ["api://AzureADTokenExchange"]
  issuer                    = var.oidc_issuer_url
  subject                   = "system:serviceaccount:${var.keda_namespace}:${var.keda_service_account_name}"
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

# Profile picture storage. Deliberately NOT behind Key Vault -- unlike
# OPENAI_API_KEY this needs no secret at all: the backend authenticates via
# the same Workload Identity (azurerm_user_assigned_identity.backend) it
# already uses for Key Vault, just granted a role on this account instead of
# a vault. Standard/LRS -- cheapest tier, same "learning" cost-consciousness
# as the vault above (rbac_authorization_enabled, no georedundancy needed).
resource "azurerm_storage_account" "avatars" {
  name                     = var.storage_account_name != null ? var.storage_account_name : "paavatars${random_string.kv_suffix.result}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    purpose = "personal-assistant-learning"
  }
}

# public_access = "blob" -- anonymous read on blob CONTENTS only, no
# container listing. Avatars are non-sensitive and rendered directly as
# <img src>, so a stable public URL beats minting/refreshing SAS tokens for
# a picture that isn't secret to begin with (confirmed with the app owner).
resource "azurerm_storage_container" "avatars" {
  name                  = "avatars"
  storage_account_id    = azurerm_storage_account.avatars.id
  container_access_type = "blob"
}

# Storage Blob Data Contributor: read/write/delete blob contents, nothing
# account-level (can't touch access keys, replication, network rules).
# Same least-privilege-per-component shape as backend_kv_secrets_user above
# -- this identity's entire job here is uploading one blob per user.
resource "azurerm_role_assignment" "backend_storage_blob_contributor" {
  scope                = azurerm_storage_account.avatars.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.backend.principal_id
}

# Job queue for the KEDA scaling test. Same storage account as avatars --
# a Storage Account natively hosts blob+queue+table+file, no reason to
# spin up a second account just to isolate two data types this project
# already treats as equally non-sensitive/low-stakes. "backend-jobs" is
# the real work queue; "backend-jobs-poison" is a hand-rolled dead-letter
# queue (Storage Queue has no native DLQ the way Service Bus does -- the
# consumer itself tracks each message's dequeue_count and moves it here
# after too many failed attempts, see adapters/queue/azure_queue_storage.py).
resource "azurerm_storage_queue" "backend_jobs" {
  name               = "backend-jobs"
  storage_account_id = azurerm_storage_account.avatars.id
}

resource "azurerm_storage_queue" "backend_jobs_poison" {
  name               = "backend-jobs-poison"
  storage_account_id = azurerm_storage_account.avatars.id
}

# Storage Queue Data Contributor: read/add/update/delete queue MESSAGES and
# the queues themselves, nothing account-level -- same shape as the blob
# role above. One assignment covers both jobs this identity does with
# queues: the backend pod producing/consuming as itself, and KEDA polling
# queue length as this same identity (federated_identity_credential.keda
# above) -- no separate reader role needed for KEDA specifically.
resource "azurerm_role_assignment" "backend_storage_queue_contributor" {
  scope                = azurerm_storage_account.avatars.id
  role_definition_name = "Storage Queue Data Contributor"
  principal_id         = azurerm_user_assigned_identity.backend.principal_id
}
