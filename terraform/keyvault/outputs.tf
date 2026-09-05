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

output "storage_account_blob_endpoint" {
  description = "Feeds the application stage's backend_storage_account_url variable, and the Helm chart's backend.env.azureStorageAccountUrl value -- same manual-wiring pattern as backend_identity_client_id above. Not secret: this is a public HTTPS endpoint, the backend authenticates to it via Workload Identity, not a key."
  value       = azurerm_storage_account.avatars.primary_blob_endpoint
}

output "storage_account_queue_endpoint" {
  description = "Feeds the application stage's backend_storage_queue_url variable, and the Helm chart's backend.env.azureStorageQueueUrl value. Same account as the blob endpoint above, different service endpoint -- not secret, same Workload Identity auth."
  value       = azurerm_storage_account.avatars.primary_queue_endpoint
}

output "storage_account_name" {
  description = "Feeds the application stage's queue.accountName Helm value -- KEDA's azure-queue scaler trigger wants the bare account name, not a URL."
  value       = azurerm_storage_account.avatars.name
}

output "set_openai_secret_command" {
  description = "One-time, run manually (not via Terraform -- keeps the raw key out of any .tf file, tfvars, and tfstate). Requires the caller's own az login identity to have Key Vault Secrets Officer (or Contributor) on this vault -- separate from the backend's own read-only Secrets User role above."
  value       = "az keyvault secret set --vault-name ${azurerm_key_vault.this.name} --name openai-api-key --value \"$OPENAI_API_KEY\""
}
