output "get_ingress_ip_command" {
  description = "The Load Balancer's public IP isn't reliably knowable at apply time (Azure assigns it async after the Service is created) -- run this after apply to get it."
  value       = "kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'"
}
