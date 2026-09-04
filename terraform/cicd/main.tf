data "azurerm_client_config" "current" {}

# GitHub Actions authenticates to Azure via OpenID Connect (OIDC) -- no
# stored client secret anywhere, no long-lived credential to rotate or
# leak. GitHub's own OIDC token gets exchanged for a short-lived Azure AD
# token at workflow run time, trusted only because the federated identity
# credential below says "this exact GitHub repo, this branch" is allowed
# to assume this identity. Same Pattern-B, no-static-keys shape as the
# AKS kubelet's Managed Identity pulling from this same ACR
# (terraform/aks-infra/main.tf) -- see docs/AWS_vs_AZURE_PERMISSIONS.md.

resource "azuread_application" "github_actions" {
  display_name = "personal-assistant-github-actions"
}

resource "azuread_service_principal" "github_actions" {
  client_id = azuread_application.github_actions.client_id
}

resource "azuread_application_federated_identity_credential" "github_actions" {
  application_id = azuread_application.github_actions.id
  display_name   = "github-actions-${var.github_branch}"
  description    = "Trusts GitHub Actions workflow runs dispatched against ${var.github_org}/${var.github_repo}@${var.github_branch}"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${var.github_branch}"
}

# AcrPush only -- not Contributor, not AcrPull-and-more. This identity's
# entire job is pushing images; it has no reason to be able to read
# cluster secrets, manage the registry itself, or touch anything else.
resource "azurerm_role_assignment" "github_actions_acr_push" {
  scope                = var.acr_id
  role_definition_name = "AcrPush"
  principal_id         = azuread_service_principal.github_actions.object_id
}
