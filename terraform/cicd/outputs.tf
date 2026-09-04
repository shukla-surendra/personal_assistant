output "azure_client_id" {
  description = "AZURE_CLIENT_ID GitHub Actions variable -- not secret, safe to commit/expose (identifies the App Registration, doesn't authenticate anything by itself)."
  value       = azuread_application.github_actions.client_id
}

output "azure_tenant_id" {
  value = data.azurerm_client_config.current.tenant_id
}

output "azure_subscription_id" {
  value = data.azurerm_client_config.current.subscription_id
}
