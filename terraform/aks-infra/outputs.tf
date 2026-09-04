output "resource_group_name" {
  value = azurerm_resource_group.this.name
}

output "cluster_name" {
  value = azurerm_kubernetes_cluster.this.name
}

output "acr_login_server" {
  description = "e.g. personalassistantabc123.azurecr.io -- the registry host to push images to and reference in image tags."
  value       = azurerm_container_registry.this.login_server
}

output "acr_name" {
  value = azurerm_container_registry.this.name
}

output "get_credentials_command" {
  description = "Run this to point kubectl/helm at the new cluster."
  value       = "az aks get-credentials --resource-group ${azurerm_resource_group.this.name} --name ${azurerm_kubernetes_cluster.this.name} --overwrite-existing"
}
