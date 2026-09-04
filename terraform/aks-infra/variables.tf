variable "resource_group_name" {
  description = "Resource group that holds every resource this config creates -- deleting it deletes everything, which is the whole teardown story."
  type        = string
  default     = "personal-assistant-learning"
}

variable "location" {
  description = "Azure region. eastus is usually the cheapest/most available for burstable B-series VMs; check your subscription's quota if this fails."
  type        = string
  default     = "eastus"
}

variable "cluster_name" {
  type    = string
  default = "personal-assistant-aks"
}

variable "kubernetes_version" {
  description = "Leave null to let Azure pick its current default (simplest for a learning cluster; a specific version pin matters more for a real long-lived cluster)."
  type        = string
  default     = null
}

variable "node_count" {
  description = "2 nodes: enough headroom for backend+frontend+redis+postgres plus AKS's own system pods, without paying for more than a week of learning needs. Drop to 1 to save ~half the node cost if you're comfortable with zero headroom; bump to B2ms/B4ms (see node_vm_size) before adding a 3rd node if pods start Pending on resource pressure."
  type        = number
  default     = 2
}

variable "node_vm_size" {
  description = "Standard_B2s = 2 vCPU / 4GB RAM, burstable (cheap, throttles under sustained load -- fine for a low-traffic learning deployment). Standard_B2ms (8GB) is the next step up if pods stay Pending."
  type        = string
  default     = "Standard_B2s"
}

variable "acr_id" {
  description = "From the container-registry stage's output: terraform -chdir=../container-registry output -raw acr_id. Apply that stage first."
  type        = string
}

variable "enable_container_insights" {
  description = "Azure Monitor Container Insights (pod/node metrics + log collection). Real cost driver via Log Analytics ingestion volume -- off by default. Turn on only if you specifically want to practice the observability side; watch the Log Analytics workspace's daily ingestion in Cost Management if you do."
  type        = bool
  default     = false
}

variable "budget_amount_usd" {
  description = "Monthly budget Azure Cost Management alerts against. Set well above what a week actually costs (~$25-35) so the alert means something went wrong, not that the plan is working."
  type        = number
  default     = 50
}

variable "budget_alert_email" {
  description = "Where budget-threshold alert emails go. Required -- a budget with nobody watching it isn't a safety net."
  type        = string
}
