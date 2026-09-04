# Deploying personal_assistant to AKS

A from-scratch, first-time-on-Azure runbook: get this app publicly reachable
on AKS, behind a load balancer, with rate limiting, for about a week of
learning, without surprising your $200 credit.

**Read the whole doc once before running anything.** The teardown section at
the end is not optional reading — it's the difference between this costing
~$25-35 and this costing $200.

## Four Terraform stages, and why four

```
terraform/container-registry/   ACR only. Apply ONCE, leave alone all week.
terraform/aks-infra/            AKS cluster only. Disposable -- tear down and
                                 recreate as many times as you want this week
                                 (to practice the cycle, or manage cost)
                                 without rebuilding or re-pushing images.
terraform/keyvault/              Key Vault + the backend's Workload Identity.
                                 Depends on aks-infra's OIDC issuer URL --
                                 see the "Recreating just the cluster" gotcha
                                 below before tearing aks-infra down alone.
terraform/application/          ingress-nginx + the app itself, on top of
                                 whichever cluster currently exists.
```

(A fifth, `terraform/cicd/`, exists separately for GitHub Actions'
OIDC-federated image-build identity -- optional, not part of this
core runbook. See its own resources for details.)

The registry is deliberately its own stage, in its **own resource group**,
separate from the cluster's. If ACR lived in the same resource group as the
AKS cluster, destroying that resource group (the normal teardown/recreate
move) would take every pushed image down with it — Azure resource group
deletion cascades to everything inside it, regardless of which Terraform
state manages which resource.

## What gets built, and roughly what it costs for one week

| Piece | What it is | ~Cost/week |
|---|---|---|
| AKS control plane | Free SKU tier — no uptime SLA, $0 | $0 |
| 1x Standard_D2s_v7 node | 2 vCPU / 8GB RAM | ~$22 |
| Standard Load Balancer | Required by AKS now (Basic SKU is gone) | ~$4 |
| Public IP (Standard) | Attached to the LB | ~$1 |
| ACR (Basic tier) | Container registry for your images | ~$1 |
| Managed Disk (1Gi) | Postgres's PVC | ~$0.02 |
| Container Insights | **Off by default** — log ingestion is the #1 surprise-bill cause | $0 (opt-in) |
| **Total** | | **~$28-35** |

Node size changed from the original plan: this subscription's VM-size
quota doesn't include the cheap burstable B-series at all (confirmed
against a real `400 Bad Request` from `terraform apply`, not assumed —
common anti-abuse restriction on new/trial subscriptions). `D2s_v7`
pricing verified against Azure's retail Prices API at apply time:
`$0.132/hr` in `eastus`. If your subscription's quota looks different,
check what's actually allowed before trusting these defaults:
`az vm list-skus --location eastus --size Standard_B2s --output table`
(empty output means not allowed, same as what happened here).

Prices otherwise are retail East US estimates and drift over time/region —
treat them as "the right order of magnitude," not an invoice. The bigger
point: this setup leaves you ~$165+ of margin even if something goes
sideways for a couple of days. The real risk isn't per-hour rate, it's
**forgetting to tear it down** — see the last section.

## Prerequisites

```bash
brew install azure-cli   # if not already installed
az login                 # opens a browser; picks your Azure account
az account show          # confirm it's the right subscription
```

`terraform`, `helm`, `kubectl` are already on this machine (used for the
minikube deployment earlier).

## Step 1 — Container registry (`terraform/container-registry/`), apply once

Creates: its own resource group (`personal-assistant-registry` by default)
+ an ACR (Basic tier). Nothing here references the AKS cluster at all.

```bash
cd terraform/container-registry
terraform init
terraform plan
terraform apply
terraform output acr_login_server   # save this -- both later stages need it
terraform output acr_id             # aks-infra needs this
```

Fast (ACR provisions in well under a minute) — nothing here waits on the
slow part (AKS cluster creation, next).

## Step 2 — Build and push images to ACR

This can happen now, before the cluster exists at all — it only needs the
registry from Step 1.

```bash
cd ../..   # repo root (personal_assistant/)
./scripts/build-and-push.sh          # tag=v1, builds+pushes both, auto-detects
                                       # the ACR login server from Step 1's Terraform
                                       # output -- nothing to copy-paste
```

Or one image at a time: `./scripts/build-and-push.sh v1 backend`. What it
runs under the hood, if you'd rather do it by hand:

```bash
ACR=$(terraform -chdir=terraform/container-registry output -raw acr_login_server)
az acr login --name "${ACR%%.*}"
docker build -t $ACR/personal-assistant-backend:v1 ./assistant_backend
docker build -t $ACR/personal-assistant-frontend:v1 ./assistant_web
docker push $ACR/personal-assistant-backend:v1
docker push $ACR/personal-assistant-frontend:v1
```

(`az acr build --registry <name> --image ...:v1 ./assistant_backend` is the
alternative that builds *inside* ACR — skips needing Docker locally, small
per-minute compute charge, negligible for images this size.)

## Step 3 — Cluster infrastructure (`terraform/aks-infra/`)

Creates: its own resource group (`personal-assistant-learning` by default),
VNet+subnet, AKS cluster (Free tier, 1x `Standard_D2s_v7` — see the cost
table above for why this isn't `Standard_B2s` as originally planned), an
`AcrPull` role assignment against Step 1's ACR (so AKS can pull images
without stored credentials), and an Azure Budget with email alerts at
50/80/100% of a
configurable monthly amount (default $50 — well above a real week's cost,
so a hit means something's actually wrong).

```bash
cd terraform/aks-infra
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set budget_alert_email to an address you actually check,
# and acr_id to Step 1's `terraform output -raw acr_id`

terraform init
terraform plan    # review before applying anything real/billed
terraform apply
```

Takes ~10-15 minutes (AKS cluster provisioning is the slow part). When done:

```bash
$(terraform output -raw get_credentials_command)   # points kubectl/helm at the new cluster
kubectl get nodes   # should show 2 nodes, Ready
```

**Right now**, go set a second, independent budget alert directly in the
Azure Portal (Cost Management + Billing → Budgets) — belt and suspenders;
the Terraform-managed one and a portal-native one catch different failure
modes (e.g. one existing before this resource group does).

## Step 4 — Key Vault + Workload Identity (`terraform/keyvault/`)

Creates: a Key Vault (RBAC-authorization mode), a dedicated
`azurerm_user_assigned_identity` for just the backend pod, a
`federated_identity_credential` trusting that pod's own Kubernetes
ServiceAccount token (via Step 3's OIDC issuer), and two role
assignments (the backend identity gets read-only "Key Vault Secrets
User"; your own `az login` identity gets "Key Vault Secrets Officer" so
you can actually write the secret in). Optional — skip this stage
entirely (leave `backend_workload_identity_client_id` empty in Step 5)
to fall back to the plain `secrets.openaiApiKey` Helm value instead.

```bash
cd terraform/keyvault
terraform init
terraform apply -var "oidc_issuer_url=$(terraform -chdir=../aks-infra output -raw oidc_issuer_url)"
```

Then set the actual key — **manually, never through Terraform** (keeps
the raw value out of `.tfvars` and `terraform.tfstate` entirely; the
`postgres_password`/`jwt_secret` route via `set_sensitive` still ends up
in plaintext state, this deliberately doesn't):

```bash
$(terraform output -raw set_openai_secret_command)   # after: export OPENAI_API_KEY=sk-... in your own shell first
```

## Step 5 — Application (`terraform/application/`)

Creates: `ingress-nginx` (the actual thing that gets you a public Load
Balancer + IP, and enforces rate limiting) via Helm, then the
`personal-assistant` chart itself pointed at your ACR images, with
`ingress.enabled=true`.

```bash
cd terraform/application
cp terraform.tfvars.example terraform.tfvars
# fill in: acr_login_server (from Step 1's output), postgres_password,
# jwt_secret (openssl rand -hex 32 for both), and -- if Step 4 was run --
# backend_workload_identity_client_id / key_vault_name / azure_tenant_id
# (all three from Step 4's outputs)

terraform init
terraform plan
terraform apply
```

If Step 4 was skipped, leave those three blank -- chat's `/completion`
endpoint returns a clean 503 rather than crashing. To use a key without
Key Vault at all, set the chart's `secrets.openaiApiKey` value directly
(`helm upgrade ... --set secrets.openaiApiKey=$OPENAI_API_KEY`) instead
of through this Terraform stage.

## Step 6 — Verify it's actually publicly reachable

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
  the `personal-assistant-learning` **and** `personal-assistant-registry`
  resource groups — check daily, costs lag by ~24-48h so don't expect
  same-day numbers.
- The budget alerts from Step 3 email you at 50/80/100% of `budget_amount_usd`.
- `az consumption usage list --output table` for a CLI-side check.

## Recreating just the cluster mid-week (keeping the registry)

The whole point of the multi-stage split. To tear down and rebuild the
cluster without touching your pushed images:

```bash
cd terraform/application && terraform destroy
cd ../keyvault && terraform destroy      # see the gotcha below for why this can't be skipped
cd ../aks-infra && terraform destroy
# ... later, whenever you want it back:
cd ../aks-infra && terraform apply       # same acr_id, same images already in ACR
cd ../keyvault && terraform apply -var "oidc_issuer_url=$(terraform -chdir=../aks-infra output -raw oidc_issuer_url)"
$(terraform output -raw set_openai_secret_command)   # re-set the secret -- see below
cd ../application && terraform apply
```

**Gotcha: a recreated cluster gets a brand-new OIDC issuer URL.** Every
AKS cluster mints its own unique `oidc_issuer_url` at creation time --
even with identical config, destroying and recreating aks-infra produces
a *different* URL than before. The `keyvault` stage's
`federated_identity_credential` is pinned to whatever URL it was applied
with, so a stale one silently stops matching the new cluster's pod
tokens -- Workload Identity auth would fail with no obvious error
pointing at "the issuer URL changed." Reapplying `keyvault` after recreating `aks-infra` fixes the mismatch --
but `keyvault`'s vault lives inside `aks-infra`'s own resource group
(deliberately, see `terraform/keyvault/variables.tf`'s comment), so
destroying `aks-infra` while `keyvault` still exists would take the
vault down as an uncontrolled side effect of the resource-group
deletion, orphaning `keyvault`'s own Terraform state. Destroying
`keyvault` first, as shown above, avoids that. Either way, the vault
comes back empty on recreate -- re-run the `az keyvault secret set`
command afterward.

## Teardown — do this before the week is out, not after

Destroy in this order — application first, so Helm gets a chance to clean
up the Load Balancer/Public IP *before* the VNet they sit in disappears out
from under them; then keyvault, since it lives inside aks-infra's resource
group and would otherwise get taken down as an uncontrolled side effect
of that group's deletion (see the recreate-gotcha above); then the
cluster; then finally the registry (the one thing you were deliberately
keeping alive all week):

```bash
cd terraform/application
terraform destroy       # removes the Helm releases -- LB, Public IP, Ingress cleanly torn down

cd ../keyvault
terraform destroy       # removes the vault, the backend identity, its federated credential + role assignments

cd ../aks-infra
terraform destroy       # removes the AKS cluster (+ its MC_* resource group), VNet, budget, resource group

cd ../container-registry
terraform destroy       # removes the ACR and every image in it -- do this LAST, only once you're actually done
```

Confirm nothing's left:

```bash
az group list --output table   # personal-assistant-learning, its MC_* pair, and personal-assistant-registry should all be gone
```

If `terraform destroy` fails partway (it happens), the reliable fallback is
deleting both resource groups directly:

```bash
az group delete --name personal-assistant-learning --yes --no-wait
az group delete --name personal-assistant-registry --yes --no-wait
```

That's a real destructive action against your real subscription — run it
yourself, don't have anything automated do it for you.
