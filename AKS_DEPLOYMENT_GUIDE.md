# Deploying personal_assistant to AKS

A from-scratch, first-time-on-Azure runbook: get this app publicly reachable
on AKS, behind a load balancer, with rate limiting, for about a week of
learning, without surprising your $200 credit.

**Read the whole doc once before running anything.** The teardown section at
the end is not optional reading — it's the difference between this costing
~$25-35 and this costing $200.

## What gets built, and roughly what it costs for one week

| Piece | What it is | ~Cost/week |
|---|---|---|
| AKS control plane | Free SKU tier — no uptime SLA, $0 | $0 |
| 2x Standard_B2s nodes | 2 vCPU / 4GB RAM each, burstable | ~$16 |
| Standard Load Balancer | Required by AKS now (Basic SKU is gone) | ~$4 |
| Public IP (Standard) | Attached to the LB | ~$1 |
| ACR (Basic tier) | Container registry for your images | ~$1 |
| Managed Disk (1Gi) | Postgres's PVC | ~$0.02 |
| Container Insights | **Off by default** — log ingestion is the #1 surprise-bill cause | $0 (opt-in) |
| **Total** | | **~$25-35** |

Prices are retail East US estimates and drift over time/region — treat them
as "the right order of magnitude," not an invoice. The bigger point: this
setup leaves you ~$165+ of margin even if something goes sideways for a
couple of days. The real risk isn't per-hour rate, it's **forgetting to tear
it down** — see the last section.

## Prerequisites

```bash
brew install azure-cli   # if not already installed
az login                 # opens a browser; picks your Azure account
az account show          # confirm it's the right subscription
```

`terraform`, `helm`, `kubectl` are already on this machine (used for the
minikube deployment earlier).

## Step 1 — Cluster infrastructure (`terraform/aks-infra/`)

Creates: resource group, VNet+subnet, AKS cluster (Free tier, 2x
`Standard_B2s`), ACR, an `AcrPull` role assignment so AKS can pull images
without stored credentials, and an Azure Budget with email alerts at
50/80/100% of a configurable monthly amount (default $50 — well above a
real week's cost, so a hit means something's actually wrong).

```bash
cd terraform/aks-infra
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set budget_alert_email to an address you actually check

terraform init
terraform plan    # review before applying anything real/billed
terraform apply
```

Takes ~10-15 minutes (AKS cluster provisioning is the slow part). When done:

```bash
terraform output acr_login_server   # save this, application/ needs it
$(terraform output -raw get_credentials_command)   # points kubectl/helm at the new cluster
kubectl get nodes   # should show 2 nodes, Ready
```

**Right now**, go set a second, independent budget alert directly in the
Azure Portal (Cost Management + Billing → Budgets) — belt and suspenders;
the Terraform-managed one and a portal-native one catch different failure
modes (e.g. one existing before this resource group does).

## Step 2 — Build and push images to ACR

```bash
cd ../..   # repo root (personal_assistant/)
ACR=$(terraform -chdir=terraform/aks-infra output -raw acr_login_server)

az acr login --name "${ACR%%.*}"

docker build -t $ACR/personal-assistant-backend:v1 ./assistant_backend
docker build -t $ACR/personal-assistant-frontend:v1 ./assistant_web
docker push $ACR/personal-assistant-backend:v1
docker push $ACR/personal-assistant-frontend:v1
```

(`az acr build --registry <name> --image ...:v1 ./assistant_backend` is the
alternative that builds *inside* ACR — skips needing Docker locally, small
per-minute compute charge, negligible for images this size.)

## Step 3 — Application (`terraform/application/`)

Creates: `ingress-nginx` (the actual thing that gets you a public Load
Balancer + IP, and enforces rate limiting) via Helm, then the
`personal-assistant` chart itself pointed at your ACR images, with
`ingress.enabled=true`.

```bash
cd terraform/application
cp terraform.tfvars.example terraform.tfvars
# fill in: acr_login_server (from Step 1's output), postgres_password,
# jwt_secret (openssl rand -hex 32 for both), openai_api_key (optional)

terraform init
terraform plan
terraform apply
```

## Step 4 — Verify it's actually publicly reachable

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
# EXTERNAL-IP column -- can take 1-2 minutes to populate after apply

IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -s -o /dev/null -w "%{http_code}\n" http://$IP/            # frontend, expect 200
curl -s http://$IP/api/v1/users/signup -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"aks-test@example.com","password":"TestPass123!","first_name":"AKS","last_name":"Test"}'
```

Open `http://$IP/` in a browser — this is the same app you already tested
on minikube, now on a real public IP.

## Rate limiting — what's actually enforcing it, and how to see it work

Two independent layers, on purpose:

1. **`ingress-nginx`** (`nginx.ingress.kubernetes.io/limit-rps: "10"` on the
   app's Ingress, `helm/personal-assistant/templates/ingress.yaml`) — caps
   requests **per client IP** at the cluster edge, before a request ever
   reaches a pod. Protects against a flood driving up LB data-processing
   cost or overwhelming the 2-node pool.
2. **The app's own limiter** (`assistant_backend/middleware/rate_limit.py`,
   Redis-backed) — per-user API quotas (100/min authenticated, 20/min
   not) once a request is already past the edge.

To see #1 fire, hammer it past 10 req/s from one IP:

```bash
for i in $(seq 1 30); do curl -s -o /dev/null -w "%{http_code} " http://$IP/api/v1/users/signup -X POST -H "Content-Type: application/json" -d '{}'; done
```

You should see `503`s (nginx's default rate-limit rejection status) mixed
in once you exceed the burst allowance (`burstMultiplier: 5` → roughly 50
requests before rejection kicks in, per nginx's leaky-bucket algorithm).

Tune via `helm/personal-assistant/values.yaml`'s `ingress.rateLimit` block,
or `helm upgrade` with `--set ingress.rateLimit.requestsPerSecond=<n>`.

## Monitoring cost during the week

- Azure Portal → **Cost Management + Billing → Cost analysis**, scoped to
  the `personal-assistant-learning` resource group — check daily, costs lag
  by ~24-48h so don't expect same-day numbers.
- The budget alerts from Step 1 email you at 50/80/100% of `budget_amount_usd`.
- `az consumption usage list --output table` for a CLI-side check.

## Teardown — do this before the week is out, not after

Destroying the resource group deletes everything in it (AKS, ACR, VNet,
disks, the auto-managed `MC_*` node resource group AKS creates alongside
it) — but destroy in this order so Helm gets a chance to clean up the Load
Balancer/Public IP *before* the VNet they sit in disappears out from under
them:

```bash
cd terraform/application
terraform destroy       # removes the Helm releases -- LB, Public IP, Ingress cleanly torn down

cd ../aks-infra
terraform destroy       # removes the AKS cluster (+ its MC_* resource group), ACR, VNet, budget, resource group
```

Confirm nothing's left:

```bash
az group list --output table   # personal-assistant-learning and its MC_* pair should both be gone
```

If `terraform destroy` fails partway (it happens), the reliable fallback is
deleting the resource group directly:

```bash
az group delete --name personal-assistant-learning --yes --no-wait
```

That's a real destructive action against your real subscription — run it
yourself, don't have anything automated do it for you.
