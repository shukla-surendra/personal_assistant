output "resource_group_name" {
  value = data.azurerm_resource_group.this.name
}

output "cluster_name" {
  value = azurerm_kubernetes_cluster.this.name
}

output "get_credentials_command" {
  description = "Run this to point kubectl/helm at the new cluster."
  value       = "az aks get-credentials --resource-group ${data.azurerm_resource_group.this.name} --name ${azurerm_kubernetes_cluster.this.name} --overwrite-existing"
}

output "oidc_issuer_url" {
  description = "Feeds the keyvault stage's federated_identity_credential -- this is what lets a Kubernetes ServiceAccount token be trusted as an Azure AD identity."
  value       = azurerm_kubernetes_cluster.this.oidc_issuer_url
}
