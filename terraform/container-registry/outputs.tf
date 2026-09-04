output "acr_id" {
  description = "Feed into aks-infra's acr_id variable, for the AcrPull role assignment."
  value       = azurerm_container_registry.this.id
}

output "acr_login_server" {
  description = "e.g. personalassistantabc123.azurecr.io -- push images here; also feeds application/'s acr_login_server variable."
  value       = azurerm_container_registry.this.login_server
}

output "acr_name" {
  value = azurerm_container_registry.this.name
}

output "resource_group_name" {
  value = azurerm_resource_group.this.name
}
