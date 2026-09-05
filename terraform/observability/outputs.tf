output "namespace" {
  value = var.namespace
}

output "get_grafana_admin_password_command" {
  description = "Chart-generated admin password (not set via Terraform, so it never lands in tfvars/tfstate)."
  value       = "kubectl get secret -n ${var.namespace} kube-prometheus-stack-grafana -o jsonpath='{.data.admin-password}' | base64 -d"
}

output "grafana_port_forward_command" {
  description = "No public LB for Grafana -- port-forward to view it, same cost-consciousness as everything else in this project."
  value       = "kubectl port-forward -n ${var.namespace} svc/kube-prometheus-stack-grafana 3000:80"
}
