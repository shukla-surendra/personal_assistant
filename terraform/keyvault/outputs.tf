output "key_vault_name" {
  value = azurerm_key_vault.this.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.this.vault_uri
}

output "backend_identity_client_id" {
  description = "Feeds the application stage's backend_workload_identity_client_id variable, and the Helm chart's backend.workloadIdentityClientId value."
  value       = azurerm_user_assigned_identity.backend.client_id
}

output "tenant_id" {
  value = data.azurerm_client_config.current.tenant_id
}

output "set_openai_secret_command" {
  description = "One-time, run manually (not via Terraform -- keeps the raw key out of any .tf file, tfvars, and tfstate). Requires the caller's own az login identity to have Key Vault Secrets Officer (or Contributor) on this vault -- separate from the backend's own read-only Secrets User role above."
  value       = "az keyvault secret set --vault-name ${azurerm_key_vault.this.name} --name openai-api-key --value \"$OPENAI_API_KEY\""
}
