variable "resource_group_name" {
  description = "Must match the container-registry stage's resource_group_name -- the one shared RG for the whole project."
  type        = string
  default     = "personal-assistant-learning"
}

variable "cluster_name" {
  description = "Must match the aks-infra stage's cluster_name."
  type        = string
  default     = "personal-assistant-aks"
}

variable "namespace" {
  description = "Deliberately its OWN stage/namespace, separate from any single app's own namespace -- this is cluster-wide shared infrastructure (same reasoning as terraform/application's ingress-nginx and KEDA), not something that should be destroyed if any one project's `terraform destroy` runs. A future second project sharing this cluster would get its own app namespace but reuse this same observability stack, not install a second copy of it."
  type        = string
  default     = "monitoring"
}

variable "grafana_admin_password" {
  description = "Leave null to let the chart generate a random one (retrieve via: kubectl get secret -n monitoring kube-prometheus-stack-grafana -o jsonpath='{.data.admin-password}' | base64 -d). Set explicitly only if you want a known password."
  type        = string
  default     = null
  sensitive   = true
}
