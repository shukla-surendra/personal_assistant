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
  description = "1 node: this subscription's VM-size quota doesn't include the cheap burstable B-series (confirmed via the actual CreateOrUpdate error -- common anti-abuse restriction on new/trial subscriptions), so node_vm_size below is a pricier D-series instead. One D2s_v7 (8GB RAM) matches the total RAM originally planned as 2x Standard_B2s (2x4GB) at roughly half the node cost of running 2x D2s_v7. Bump to 2+ if pods start Pending on resource pressure -- costs real money per the pricing note below, check `az vm list-skus --location <region> --size <size> --output table` (or the Azure retail Prices API) for current numbers before assuming."
  type        = number
  default     = 1
}

variable "node_vm_size" {
  description = "Standard_D2s_v7 = 2 vCPU / 8GB RAM. Standard_B2s (2 vCPU/4GB, burstable, cheaper) was the original plan but isn't in this subscription's allowed VM-size list at all -- confirmed against the real CreateOrUpdate 400 error, not assumed. Verified pricing via https://prices.azure.com/api/retail/prices at time of writing: ~$0.132/hr in eastus (~$22/week for one node) -- notably more than B2s would have been. If your subscription's quota differs, check what's actually allowed before trusting this default: `az vm list-skus --location eastus --size Standard_B2s --output table` (empty output = not allowed)."
  type        = string
  default     = "Standard_D2s_v7"
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
