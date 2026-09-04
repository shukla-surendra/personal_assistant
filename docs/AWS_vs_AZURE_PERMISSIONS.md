# AWS vs. Azure permissions — grounded in this app's actual code

Not a general reference — every example here is either dead code already
sitting in `assistant_backend/` or the live Terraform in `terraform/`. The
point is to be able to look at the `azurerm_role_assignment` block you're
about to `apply` and know exactly what it does and why it's the safer
choice, not just trust it.

## Your AWS mental model, restated precisely

What you described — **User → Group → Policy/Role → Access Key + Secret
Key → used via CLI/boto3** — is real, but it's actually *two different
patterns* AWS supports, and the distinction matters a lot:

**Pattern A — static long-lived credentials.** A human (or a script) is
issued an **Access Key ID + Secret Access Key** tied to an IAM **User**.
That key pair works forever until someone manually rotates or revokes it.
`aws configure` writes it to `~/.aws/credentials`; boto3 reads it from
there (or from `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` env vars) on
every call. This is what most people mean by "the AWS way," and it's also
the pattern AWS's own docs spend the most effort telling you to avoid for
anything long-running.

**Pattern B — a role assumed by compute, no stored keys at all.** An EC2
instance / ECS task / Lambda / EKS pod is given an IAM **Role** (an
"instance profile" for EC2, a "task role" for ECS, "IRSA" for EKS). AWS's
metadata service hands the process **temporary, auto-rotating** credentials
— nothing is ever written to disk, nothing to rotate manually, nothing to
leak in a git commit. boto3 finds these automatically as the *last* step in
its credential search chain, with zero code changes from Pattern A.

Azure has the exact same two-pattern split. It just names them differently
and, unlike AWS, makes Pattern B unmissable by giving it its own object
type (Managed Identity) rather than overloading "Role" to mean both "a
permission grant" and "a thing compute can assume."

## The direct translation

| AWS concept | Azure concept | Where |
|---|---|---|
| IAM **User** | **Entra ID** user/identity object | tenant-wide directory, not scoped to one subscription |
| IAM **Group** | Entra ID **Group** | same idea, membership-based |
| IAM **Policy** (a JSON permission document) | Azure **Role Definition** (a set of `Actions`/`DataActions`) | see the sharper split below |
| IAM **Role** assumed by a person/service | **Service Principal** (for apps/scripts) or **Managed Identity** (for Azure compute) | two different Azure objects for what AWS calls one thing |
| **Access Key ID + Secret Access Key** | Service Principal **client ID + client secret** (or certificate) | both are static/long-lived; both need manual rotation |
| IAM Role attached to an EC2 instance (Pattern B) | **Managed Identity** attached to Azure compute | *this* is what the Terraform uses — see below |
| `aws configure` / `~/.aws/credentials` | `az login` (interactive) | different auth flow, see below |
| Attaching a Policy to a User/Group/Role | **Role Assignment** = `(identity, role definition, scope)` | Azure's explicit 3-tuple; AWS's is implicit in "which policy is attached where" |

## The one sharp difference AWS engineers consistently miss

An AWS IAM policy statement granting `s3:GetObject` covers reading the
actual bytes — control-plane and data-plane access are the same grant.
**Azure splits every Role Definition into `Actions` (management plane —
create/delete/configure a resource) and `DataActions` (data plane — read
the actual bytes/rows/messages inside it), as two independently-grantable
permission classes.** A role with full `Actions` on a storage account does
**not** automatically let you read a blob's contents — that needs a
separate `DataActions` grant. There's no AWS equivalent forcing this split;
it's a different default security posture, not just different syntax.
(Full depth on this: `platform-lab/cloud-practice/azure/docs/entra-id/architecture.md` §3a.)

## Example 1 — this app's dead AWS code, read correctly

```python
# adapters/storage/dynamodb_adapter.py
self.dynamodb = boto3.resource('dynamodb', region_name=self.config.aws_region)
```

```python
# adapters/auth/cognito_adapter.py
self.cognito = boto3.client('cognito-idp', region_name=self.config.AWS_REGION or 'ap-south-1')
```

Neither line passes `aws_access_key_id` or `aws_secret_access_key`. That's
not a bug — it's boto3 silently walking its **default credential chain**:
environment variables → `~/.aws/credentials` → an IAM role from the
instance metadata service, first match wins. `config.py` *does* define
`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` fields, but nothing in this
codebase ever forwards them into these calls — they're redundant with
boto3's own env-var scanning (same variable names), which is why removing
them wouldn't break anything. If this code ever ran on an EC2 instance
with an attached IAM role, it would authenticate via Pattern B with **zero
changes** — that's the whole design point of the default chain.

## Example 2 — the live Azure code in `terraform/aks-infra/main.tf`

```hcl
resource "azurerm_kubernetes_cluster" "this" {
  # ...
  identity {
    type = "SystemAssigned"   # AKS gets its own Managed Identity
  }
}

resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = azurerm_container_registry.this.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.this.kubelet_identity[0].object_id
}
```

Walk this exactly like the boto3/EC2-role case above:

1. `identity { type = "SystemAssigned" }` — Azure auto-creates a Managed
   Identity *for this specific AKS cluster*, with a lifecycle tied to the
   cluster (delete the cluster, the identity is gone too — this is the
   "system-assigned" flavor from the Entra ID module, §3c).
2. AKS actually exposes a *second*, related identity specifically for
   node/kubelet operations — `kubelet_identity` — which is what actually
   needs to pull container images.
3. `azurerm_role_assignment` is the Azure **Role Assignment** 3-tuple made
   literal: `(kubelet_identity.object_id, "AcrPull", the ACR resource)`.
   This is the direct Azure equivalent of attaching an `AmazonEC2ContainerRegistryReadOnly`-style
   policy to an EC2 instance role.
4. Nowhere in this file, or anywhere in `terraform/application/`, is there
   an ACR username/password or access key. `admin_enabled = false` on the
   registry (`main.tf`) exists specifically to make sure that door stays
   closed — the only way in is this role assignment.

When a backend pod pulls `$ACR_LOGIN_SERVER/personal-assistant-backend:v1`,
the kubelet on that node authenticates to ACR *as the Managed Identity*,
gets a short-lived token, pulls the image. Same shape as an EKS pod's IRSA
role reaching into ECR — different object names, identical mechanism.

## `az login` vs. `aws configure` — the CLI auth flow itself

`aws configure` interactively asks you to **paste** a static Access Key
ID + Secret Access Key (Pattern A, by default — nothing wrong with it for
a human at a laptop, but it's the same static-credential shape as the
Cognito/DynamoDB example above).

`az login` (what you'll run before any of the Terraform in this repo)
opens a browser, you sign in normally, and the CLI receives a **short-lived
OAuth token** from Entra ID — no key pair to generate, store, or rotate.
The closer AWS equivalent isn't `aws configure` at all — it's `aws sso
login` (AWS IAM Identity Center), which most orgs actually mandate for
humans precisely because it avoids Pattern A's rotation/leak risk. Azure
just makes the token-based flow the *default* CLI experience instead of an
opt-in.

## Scope hierarchy — same shape, different names

```
AWS:    Organization → OU → Account          → resource
Azure:  Management Group → Subscription → Resource Group → resource
```

A Role Assignment made at Resource Group scope (like this project's
`personal-assistant-learning` RG) inherits down to every resource created
inside it — same cascading-down behavior as an AWS SCP at the OU level,
except in Azure this is Azure RBAC's *default* behavior for an ordinary
role assignment, not a separate product layered on top the way AWS
Organizations SCPs are. (Full depth: Entra ID module §3b.)

## Before you run `terraform apply` — say these back

1. In `adapters/storage/dynamodb_adapter.py`, `boto3.resource('dynamodb', ...)`
   is called with no credentials. If this ran on an EC2 instance with an
   attached IAM role, would it work without code changes? Why?
2. In `terraform/aks-infra/main.tf`, what specific identity gets the
   `AcrPull` role, and what happens to that identity if the AKS cluster is
   deleted?
3. When a backend pod in AKS pulls its image from ACR, what credential
   (if any) is actually presented to ACR, and where does it come from?
4. `admin_enabled = false` on the `azurerm_container_registry` resource —
   what does that close off, and why does the setup still work without it?

Answer those in your own words before we run `terraform apply` for real —
that's the actual point of this doc, not just having it on file.

---

## Session log — appended as we actually work through this

### 2026-09-04 — installing `az` CLI on this Mac

```bash
brew install azure-cli
az version   # confirmed: azure-cli 2.90.0
```

No Azure account interaction yet — this is a purely local install, same
category of action as installing `terraform`/`helm`/`kubectl` earlier.
Nothing billed, nothing that touches your subscription.

**Next real step, and it's yours to run** (this is the first thing that
actually talks to your Azure account):

```bash
az login
```

This opens a browser, you sign in with the account tied to your $200
credit, and `az` receives a short-lived OAuth token — the exact "Pattern B,
no static keys" flow this doc's `az login` section above described, now
for real instead of in the abstract. No Access Key ID / Secret Access Key
equivalent to generate or paste anywhere.

After it completes, confirm you landed on the right subscription (if
you have more than one) before anything else:

```bash
az account show
# if the wrong one comes back and you have others:
az account list --output table
az account set --subscription "<name-or-id>"
```

Run `az login` yourself (or `! az login` here so I see the output) and tell
me what `az account show` reports back.

### 2026-09-04 — `az login` result

```
Tenant: Default Directory
Subscription: Azure subscription 1 (1f7b45cd-c3f3-487c-8cc6-8eeb3d1ce432)
```

Confirms exactly the tenant/subscription relationship from the Entra ID
module (`platform-lab/cloud-practice/azure/docs/entra-id/architecture.md`
§2): **one Entra ID tenant** ("Default Directory" — Azure's auto-provisioned
name when a personal account is created, nobody renamed it) **trusted by
one subscription** ("Azure subscription 1" — also the default name; you can
rename both later in the portal, purely cosmetic, doesn't change the
relationship). Only one of each here since this is a brand-new personal
account, which is exactly why `az login` didn't even have to ask which
tenant/subscription to use — with only one candidate, it auto-selected.

Contrast: an AWS **Account** is a single flat thing that's simultaneously
the billing boundary, the IAM boundary, and the resource-isolation
boundary. Azure splits that into two separately-lifecycled objects —
identity (tenant) and billing/resources (subscription) — specifically so
one tenant *can* later trust multiple subscriptions at once (dev/staging/
prod, each with its own billing, all still governed by the same directory).
Nothing to act on for this project, just worth noticing now that you're
looking at your own real tenant/subscription pair instead of the abstract
version.

**Next real step** (still no billed resources created — `plan` only reads
and diffs, never creates). Updated after restructuring into three stages
(see `AKS_DEPLOYMENT_GUIDE.md`) — registry first, since it's independent of
the cluster and everything else depends on it existing:

```bash
cd terraform/container-registry
terraform init      # if you haven't already
terraform plan       # first real contact between Terraform and your actual subscription
```

`terraform`'s `azurerm` provider picks up `az login`'s cached credentials
automatically — no separate auth step, no key to paste. That itself is
another live instance of the token-based (Pattern B-shaped) flow versus
AWS's more common "paste an access key into a provider block" pattern.

---

## `az` CLI — helpful and most-used commands

Grouped by what you'll actually reach for on this project, not an
exhaustive reference. AWS CLI equivalent noted where it helps map onto
what you already know.

### Auth & account/subscription

```bash
az login                              # aws: aws sso login (token-based) / aws configure (static keys)
az account show                       # aws: aws sts get-caller-identity
az account list --output table        # list every subscription this login can see
az account set --subscription "<name-or-id>"   # aws: aws configure set / --profile
az logout
```

### Resource groups (aws: no exact equivalent — closest is a CloudFormation stack's boundary, or just tags)

```bash
az group list --output table
az group show --name personal-assistant-learning
az group delete --name personal-assistant-learning --yes --no-wait   # the teardown command from AKS_DEPLOYMENT_GUIDE.md
```

### AKS (aws: eksctl / aws eks)

```bash
az aks list --output table
az aks show --resource-group personal-assistant-learning --name personal-assistant-aks
az aks get-credentials --resource-group personal-assistant-learning --name personal-assistant-aks --overwrite-existing
                                       # aws: aws eks update-kubeconfig --name <cluster>
az aks nodepool list --resource-group personal-assistant-learning --cluster-name personal-assistant-aks --output table
az aks stop  --resource-group personal-assistant-learning --name personal-assistant-aks   # stops billing for the
az aks start --resource-group personal-assistant-learning --name personal-assistant-aks   # node pool (not the whole
                                                                                             # RG) -- useful if you
                                                                                             # want the cluster to
                                                                                             # exist but stop paying
                                                                                             # for compute overnight
                                                                                             # during the learning week
```

### ACR (aws: aws ecr)

```bash
az acr login --name <registry-name-without-.azurecr.io>   # aws: aws ecr get-login-password | docker login
az acr repository list --name <registry-name> --output table
az acr repository show-tags --name <registry-name> --repository personal-assistant-backend --output table
az acr build --registry <registry-name> --image personal-assistant-backend:v1 ./assistant_backend
                                       # builds *inside* ACR -- no local docker build needed
```

### Cost (aws: aws ce get-cost-and-usage — Cost Explorer's CLI surface)

```bash
az consumption usage list --output table          # line-item usage; can be slow/limited on some subscription types
az billing account list                            # only relevant if you're on an Enterprise/MCA agreement, not a
                                                     # pay-as-you-go personal subscription like this one
```
Realistically, Cost Management's CLI surface is thin compared to the
Portal — for this project, **Portal → Cost Management + Billing → Cost
analysis** (scoped to `personal-assistant-learning`) is the faster way to
actually see where money's going, the CLI commands above are more for
scripting/automation later.

### Global flags worth knowing immediately

```bash
--output table   # -o table   -- human-readable (default is JSON)
--output tsv      # -o tsv     -- for piping into other commands/scripts
--query "<JMESPath>"   # aws: --query too (same JMESPath language, one of the few things that transferred directly)

# example: get just the ACR login server, nothing else
az acr show --name <registry-name> --query loginServer --output tsv
```

```bash
az configure   # interactive: set default resource group/location so you stop retyping --resource-group every time
az upgrade      # keep the CLI itself current
```

---

### 2026-09-04 — first real resources created: `container-registry` applied, images pushed

```bash
cd terraform/container-registry
terraform plan    # 3 to add, 0 to change, 0 to destroy -- reviewed before applying
terraform apply   # real: resource group + ACR now exist in your subscription
```

Result: `personalassistantfoylsi.azurecr.io`, resource group
`personal-assistant-registry`. First real billed resource of this whole
exercise (~$1/week).

**Caught before pushing**: the backend image was **10.2GB** — `torch`/
`transformers`/`accelerate`/CUDA deps, unused except by `core/agent.py`'s
dead Llama-2-7B feature (needs a gated HF model + real GPU; couldn't work
on a `Standard_B2s` CPU-only node regardless). Fixed:
- Removed those 4 lines from `assistant_backend/requirements.txt`
- Made `core/agent.py`'s `import torch` / `from transformers import ...`
  lazy (moved inside `Agent.__init__`, not module-level) — otherwise
  removing the packages would crash the **entire app** at startup, since
  `main.py` always loads `assistant_controller.py`, which always imports
  `core.agent` at module level, regardless of whether anyone ever calls
  that feature.
- Rebuilt: **1.21GB** (a normal size for this dependency footprint).
  Reverified locally first — `docker compose up -d --build backend`, all
  24 pytest tests still passed — before pushing anything.

```bash
az acr login --name personalassistantfoylsi
docker tag personal-assistant-backend:latest  personalassistantfoylsi.azurecr.io/personal-assistant-backend:v1
docker tag personal-assistant-frontend:latest personalassistantfoylsi.azurecr.io/personal-assistant-frontend:v1
docker push personalassistantfoylsi.azurecr.io/personal-assistant-backend:v1
docker push personalassistantfoylsi.azurecr.io/personal-assistant-frontend:v1
```

Verified server-side, not just trusting the push output:

```bash
az acr repository list --name personalassistantfoylsi --output table
# personal-assistant-backend, personal-assistant-frontend -- both present, tag v1
```

**Next**: `terraform/aks-infra/` — the cluster itself (Step 3 in
`AKS_DEPLOYMENT_GUIDE.md`), needs `acr_id` from this stage's output:
`terraform -chdir=terraform/container-registry output -raw acr_id`.

### ACR's registry/repository nesting vs. ECR — a real structural difference

Good catch, and it's not a minor naming quirk — the two services model this
completely differently.

**ECR: repository is the resource, "registry" barely exists as a concept.**
Every AWS account implicitly has one ECR registry per region — you never
provision it, it's just there. What you *do* create is each **repository**
individually:
```bash
aws ecr create-repository --repository-name personal-assistant-backend
aws ecr create-repository --repository-name personal-assistant-frontend
```
Two `create-repository` calls, two independent resources — each with its
own repository policy (IAM), lifecycle policy, image-scan settings, and
each showing up separately in `aws ecr describe-repositories`. There's no
tier/SKU choice for ECR at all; it's flat, per-GB-storage-priced.

**ACR: registry is the resource, repository is just a namespace inside it.**
This project created exactly **one** resource —
```hcl
resource "azurerm_container_registry" "this" { ... }   # terraform/container-registry/main.tf
```
— and `personal-assistant-backend`/`personal-assistant-frontend` were never
separately created. They came into existence implicitly, the moment each
was first `docker push`ed:
```bash
docker push personalassistantfoylsi.azurecr.io/personal-assistant-backend:v1   # repo #1 born here
docker push personalassistantfoylsi.azurecr.io/personal-assistant-frontend:v1  # repo #2 born here
```
`az acr repository list --name personalassistantfoylsi` lists both because
they're just tag-namespaces inside the one registry, not independent
Azure resources — there's no `az acr repository create` command, because
there's nothing to explicitly create.

Practical consequence: the registry (not the repository) is what carries
the SKU (Basic/Standard/Premium — `sku = "Basic"` in this project's
Terraform), the RBAC scope (the `AcrPull` role assignment targets the whole
registry's resource ID, `azurerm_container_registry.this.id` — there's no
narrower "just this one repository" scope on Basic/Standard tier; that
needs Premium's repository-scoped tokens), and the network rules. In ECR,
each repository can independently have its own IAM policy from day one, no
tier requirement.

### What "foylsi" actually is

Nothing meaningful — confirmed straight from Terraform's own state:
```bash
$ terraform state show random_string.acr_suffix
resource "random_string" "acr_suffix" {
    result = "foylsi"
    length = 6
    lower  = true
    ...
}
```
It's `terraform/container-registry/main.tf`'s `random_string` resource,
plugged into the registry name:
```hcl
name = var.acr_name != null ? var.acr_name : "personalassistant${random_string.acr_suffix.result}"
```
**Why it's there at all**: an ACR name must be globally unique across *all*
of Azure, not just your subscription — the same class of constraint as an
S3 bucket name in AWS, or an Azure Storage Account name. `"personalassistant"`
alone would almost certainly already be taken by someone, somewhere, so the
Terraform appends 6 random lowercase-alphanumeric characters to guarantee a
free name without you having to think one up. `foylsi` just happened to be
what `random_string` rolled this run — a different `terraform apply` would
produce a different suffix. Set `acr_name` explicitly in `terraform.tfvars`
if you want a specific, memorable name instead (still has to be globally
unique, so you'd be gambling that nobody else has taken it).

---

### 2026-09-04 — the AKS cluster itself, including a real quota surprise

Before creating anything: walked through whether recreating a cluster mid-
week means double-billing. It doesn't — Azure meters actual runtime, not
"has this been created before." Free-tier control plane is $0 regardless
of how many times you create/delete/recreate it (no reactivation fee, no
subscription limit); the node VMs/LB/IP/disk are billed per-hour they
actually exist, so tearing down and recreating just means two separate,
smaller billing periods instead of one continuous one. The thing that
*doesn't* reset on recreation, by design: ACR (Step 1), which is exactly
why it's split into its own stage.

```bash
cd terraform/aks-infra
terraform init
terraform plan -out=tfplan   # 6 to add: resource group, VNet, subnet, AKS
                              # cluster, AcrPull role assignment, budget
terraform apply tfplan
```

**Failed partway**, with a real, useful error — not a Terraform bug:

```
Error: creating Kubernetes Cluster ...: unexpected status 400 (400 Bad Request)
"The VM size of Standard_B2s is not allowed in your subscription in location 'eastus'.
The available VM sizes are '...standard_d2s_v7...standard_f2as_v7...' [huge list, no B-series at all]"
```

This subscription's VM-size quota simply doesn't include the burstable
B-series at all — a real, common restriction on new/trial Azure
subscriptions (B-series is cheap and has historically been abused for
crypto-mining, so it's often excluded from default trial quotas until you
explicitly request it). Resource group/VNet/subnet/budget had already
created successfully before the cluster resource hit this error — Terraform's
state correctly tracked that, so the retry only needed to create the 2
resources that hadn't succeeded yet (`Plan: 2 to add`, not 6).

**Didn't guess at a replacement size or its price.** Checked what's
actually allowed against the real 400 error's own list, then queried
Azure's public retail pricing API (no auth needed) for real numbers rather
than trusting stale training-data pricing for a size generation (`_v7`)
newer than what's normally well-known:

```bash
curl -s -G "https://prices.azure.com/api/retail/prices" \
  --data-urlencode "\$filter=armRegionName eq 'eastus' and priceType eq 'Consumption' and armSkuName eq 'Standard_D2s_v7'"
# -> Standard_D2s_v7, Linux, $0.1320/hr
```

`Standard_D2s_v7` (2 vCPU/8GB) confirmed both allowed and priced. Original
plan was 2x B2s (2x4GB = 8GB total, ~$16/week); at real D2s_v7 pricing, 2
nodes would be ~$44/week for compute alone. Chose **1 node** instead —
same 8GB total RAM as the original 2-node plan, ~$22/week, keeps total
weekly cost close to the original ~$25-35 estimate. Updated
`terraform/aks-infra/variables.tf`'s defaults (`node_count = 1`,
`node_vm_size = "Standard_D2s_v7"`) with the reasoning and the exact
verification commands (`az vm list-skus --location <region> --size <size>`)
written into the variable descriptions themselves, not just this doc, so
the Terraform stays self-explaining for anyone reading it cold later.

Re-applied clean:
```
azurerm_kubernetes_cluster.this: Creation complete after 5m59s
azurerm_role_assignment.aks_acr_pull: Creation complete after 29s
Apply complete! Resources: 2 added, 0 changed, 0 destroyed.
```

Verified, not just trusted the exit code:
```bash
az aks get-credentials --resource-group personal-assistant-learning --name personal-assistant-aks --overwrite-existing
kubectl get nodes -o wide
# aks-system-13632577-vmss000000   Ready   ...   v1.35.7

az role assignment list --scope <the ACR's resource ID>
# AcrPull -> the kubelet identity's principal ID, confirmed present
```

**Next**: `terraform/application/` (Step 4) — `ingress-nginx` + the app
itself, pointed at the `v1` images already sitting in ACR from the earlier
build-and-push step.

---

### 2026-09-04 — Step 4, and two real bugs it surfaced

```bash
cd terraform/application
# terraform.tfvars: acr_login_server (from Step 1), postgres_password +
# jwt_secret (openssl rand), openai_api_key left empty
terraform init
terraform plan -out=tfplan   # 2 to add: ingress-nginx, personal-assistant
terraform apply tfplan
```

**Bug #1 — image tag default didn't match what was actually pushed.**
`terraform/application/variables.tf`'s `backend_image_tag`/
`frontend_image_tag` defaulted to `"latest"`, but `scripts/build-and-push.sh`
defaults to (and everything pushed so far used) `v1` — `latest` was never
actually pushed to ACR at all. Caught it (asked to "update helm docker
image path") *while the apply was already mid-flight* — `ingress-nginx`
had already finished, and `helm_release.personal_assistant` was already
creating with the wrong tag by the time the fix landed in `terraform.tfvars`
(a saved `-out=tfplan` plan has values baked in; editing tfvars doesn't
touch a plan already in flight). Let it finish rather than interrupt a live
`terraform apply` mid-resource-creation — it failed on its own after ~5
minutes (`helm_release` has a wait/readiness timeout; `context deadline
exceeded` once pods never came up healthy). Fixed the variable default
too (not just tfvars), so this can't quietly happen again on a fresh
checkout: `variables.tf` default is now `v1`, with the mismatch explained
directly in the description.

**Bug #2 — real Postgres-on-Kubernetes gotcha: Azure's fresh disks aren't
actually empty.** Independent of bug #1 — `personal-assistant-postgres-0`
was `CrashLoopBackOff` the whole time, for an unrelated reason:
```
initdb: error: directory "/var/lib/postgresql/data" exists but is not empty
initdb: detail: It contains a lost+found directory, perhaps due to it being a mount point.
```
Azure Disk CSI formats a freshly-provisioned PVC's volume with ext4, and
every ext4 filesystem has a `lost+found` directory at its root by design
(for `fsck` to relink orphaned inodes into) — `initdb` refuses to
initialize into any non-empty directory, `lost+found` included. Standard,
well-documented fix (same one the official `postgres` Docker image's own
docs recommend): point `PGDATA` at a subdirectory Postgres creates itself,
not at the raw mount root.
```yaml
# helm/personal-assistant/templates/postgres.yaml
- name: PGDATA
  value: /var/lib/postgresql/data/pgdata
```
Didn't need to wipe the PVC — `initdb` bailed out before writing anything
beyond the pre-existing `lost+found`, and the new `pgdata` subdirectory
starts genuinely empty regardless of what's at the volume root.

Both fixed, re-`plan`/`apply`'d together. Recovering a `helm_release` stuck
in Terraform's `"failed"` status turned out to just work as a normal
`terraform apply` — Helm's own `upgrade --install` semantics handle a
failed release transparently; no manual `helm uninstall` needed.

---

### 2026-09-04 — logging in and connecting kubectl to the control plane

**The mechanism**: `kubectl` doesn't "log in" itself — it reads a
**kubeconfig file** (`~/.kube/config` by default) that holds three linked
lists plus a pointer to which one is active:
- `clusters:` — API server URL + CA certificate, one entry per cluster
- `users:` — credentials (cert, token, or an `exec` command), one entry per identity
- `contexts:` — a named `(cluster, user, namespace)` triple
- `current-context:` — which context `kubectl` actually uses right now

Every `kubectl` command just reads whatever `current-context` points to.
This machine already has three:
```bash
$ kubectl config get-contexts
CURRENT   NAME                     CLUSTER                  AUTHINFO
          docker-desktop           docker-desktop           docker-desktop
          minikube                 minikube                 minikube
*         personal-assistant-aks   personal-assistant-aks   clusterUser_personal-assistant-learning_personal-assistant-aks
```

**The actual "login" step, AKS-specific**:
```bash
az aks get-credentials --resource-group personal-assistant-learning --name personal-assistant-aks --overwrite-existing
```
This is the direct equivalent of EKS's `aws eks update-kubeconfig --name
<cluster>` — it fetches the cluster's connection info from Azure and
merges a new `clusters:`/`users:`/`contexts:` entry into
`~/.kube/config`, then sets it as `current-context`. Nothing to type a
password into; it's reading whatever `az login` already authenticated as
(same session-scoped token from the very first `az login` earlier), the
same way `terraform`'s `azurerm` provider does.

**Switching between clusters** (useful now that minikube and AKS both
exist in the same kubeconfig):
```bash
kubectl config get-contexts                       # list all
kubectl config use-context minikube                # switch
kubectl config use-context personal-assistant-aks  # switch back
kubectl config current-context                     # confirm which one is active
```
Every `kubectl` command after `use-context` targets whichever cluster is
now current — easy to run a command against the wrong cluster by forgetting
which one's active, worth checking `current-context` before anything
destructive.

**A real AWS-vs-Azure difference this surfaced, the hard way**: checking
what kind of credential `az aks get-credentials` had actually written led
to accidentally dumping the *raw* client certificate, private key, and
token into this session (a mistake — should have checked which fields
were present, not their values; logged here so it isn't repeated). What it
confirmed: **AKS's default `clusterUser` credential is a static client
certificate**, generated once and embedded directly in `~/.kube/config`,
valid until manually rotated — *not* re-derived from your live Azure
identity on each use.

Contrast with EKS: `aws eks update-kubeconfig` writes an **`exec`-based**
user entry — no static cert at all. Every `kubectl` command runs `aws eks
get-token` (or `aws-iam-authenticator`) fresh, deriving a short-lived token
from whatever AWS credentials are active *at that moment*. Revoke the IAM
access and the next `kubectl` command fails immediately; the credential
was never sitting on disk to leak in the first place. AKS *can* work this
way too — enabling Azure AD/Entra RBAC integration on the cluster switches
it to an equivalent live-token flow (via `kubelogin`) — but that's opt-in,
not what a default `azurerm_kubernetes_cluster` (like this one) gives you.
Given the accidental exposure above, rotating this cluster's certs
(`az aks rotate-certs --resource-group personal-assistant-learning --name
personal-assistant-aks`) before it sees any real use is the cheap
precaution — optional for a one-week disposable learning cluster with
nothing real in it yet, but the right habit for anything longer-lived.

**Seeing what's actually running, once connected**:
```bash
kubectl get nodes                    # the cluster's VMs
kubectl get pods                     # every pod in the current namespace (default here)
kubectl get pods -A                  # every pod, every namespace (system + ingress-nginx + app)
kubectl get svc                      # Services, including ingress-nginx's LoadBalancer + its public IP
kubectl describe pod <name>           # events -- the actual "why is this Pending/CrashLooping" detail
kubectl logs <name>                   # a container's stdout/stderr
kubectl logs <name> -c <container>    # multi-container pod (e.g. the migration Job's wait-for-postgres init container)
```

---

### 2026-09-04 — cross-architecture image builds: another real subscription restriction

**Root cause of "frontend pod ImagePullBackOff, backend fine"**: this Mac
is Apple Silicon (arm64); `docker build` targets the host architecture by
default. Locally-built images were `arm64`; AKS's `Standard_D2s_v7` nodes
are `amd64` — kubelet's pull fails with "no match for platform in
manifest," not a permissions error despite what the accompanying `401
Unauthorized` text suggests (that part's a red herring -- containerd's
fallback-to-anonymous-pull attempt after the platform mismatch, on a
registry with `anonymous_pull_enabled = false`).

Fix, in principle simple: `docker build --platform linux/amd64 ...`. In
practice, cross-architecture emulation (QEMU) makes CPU-heavy steps much
slower than native. Backend rebuilt fine in a couple of minutes. Frontend
(`create-react-app`, a large dependency tree — Chakra UI, MUI, TipTap/
Lexical, FullCalendar, dnd-kit, Redux) took **22+ minutes just for `npm
ci`** under emulation — confirmed by killing the build and reading its
final output: `npm run build` (webpack) had only just started, 5 seconds
in, meaning nearly all that time was dependency installation, not the
bundler.

**Tried the "obvious" fix for this exact problem — building natively on
real amd64 hardware instead of emulating it locally:**
```bash
az acr build --registry personalassistantfoylsi --image personal-assistant-frontend:v1 ./assistant_web
```
```
ERROR: (TasksOperationsNotAllowed) ACR Tasks requests for the registry
personalassistantfoylsi and <subscription-id> are not permitted.
```
Blocked at the subscription level — same category as the B-series VM quota
restriction from Step 3, not a bug in this project's setup. ACR Tasks
provide real (if modest) free compute, plausibly restricted on new/trial
subscriptions for the same anti-abuse reason B-series VMs were. Checked
for a remaining alternative (`docker buildx ls` — a remote/cloud builder
would sidestep local emulation entirely) — none configured, both available
builders are the local `docker` driver. Local QEMU emulation, patience
required, is genuinely the only path available in this subscription right
now. Went back to it, this time with realistic expectations of the timing
now that it's clear where the time actually goes.

**Takeaway for anywhere else this comes up**: if you develop on Apple
Silicon and deploy to any x86_64 cloud target (AKS, EKS, GKE, a plain VM),
build images with `--platform linux/amd64` explicitly rather than relying
on the default — and budget real extra time for it locally unless a
native-arch remote builder (a cloud CI runner, `az acr build`/`docker
buildx build --builder cloud`, GitHub Actions on an `ubuntu-latest`
runner) is available, since none of that is a given on every subscription.

---

### 2026-09-04 — the app is live on AKS, and one last bug: the migration silently never ran

Frontend's amd64 image finished and pushed while waiting on an unrelated
question; all 4 pods (`backend`, `frontend`, `postgres`, `redis`) came up
`1/1 Running`. First real end-to-end test through the public Load
Balancer (`http://48.206.145.18/`):
```
POST /api/v1/users/signup -> 500 "Internal server error while creating user"
```
`kubectl logs` on the backend: `psycopg2.errors.UndefinedTable: relation
"users" does not exist`. Postgres itself was healthy — the schema was
just never created on it.

**Root cause, reconstructed from the timeline**: the migration Job
(`helm/personal-assistant/templates/migration-job.yaml`, a `post-install,
pre-upgrade` Helm hook) runs using the *backend* image. During the one
`terraform apply` where Postgres finally came up healthy (after the
`PGDATA` fix), the backend image at that exact moment was still the
broken `arm64`-only build — so the migration Job's own container almost
certainly also failed to pull, the same way the Deployment pods did, just
less visibly since a failed/pending Job doesn't show up in a plain
`kubectl get pods` glance at the long-running Deployments. Nothing in
Terraform's own output flagged this as a distinct failure — `helm_release`
reported success once the Deployments and Job resource existed, without
this session separately checking the Job's own completion status.

**Fix**, since the images and Postgres are now both actually fine and
nothing about the Helm release itself changed (so a plain `terraform
apply`/`helm upgrade` wouldn't re-trigger the hook — no diff to apply):
ran the migration directly against the already-healthy backend pod,
which already has the correct DB env vars and `alembic` installed:
```bash
kubectl exec -it deploy/personal-assistant-backend -- alembic upgrade head
```
Verified for real — all 25 tables present (`inspect(engine).get_table_names()`
via `kubectl exec`), then re-ran the actual signup call:
```
POST /api/v1/users/signup -> 201, real user_id + auto-created default workspace
```

**Lesson for next time**: after any Helm release involving a hook-based
Job, check the Job's own status explicitly (`kubectl get jobs`,
`kubectl logs job/<name>`) rather than inferring success from the
Deployments alone being healthy — a hook can fail silently relative to
the rest of the release, especially when it shares an image with
Deployments that were *also* mid-fix at the same moment.

---

### 2026-09-04 — CI builds: GitHub Actions instead of Azure DevOps, and why

Wanted to stop fighting local QEMU emulation for good by building on real
`amd64` hardware. Considered Azure DevOps Pipelines (genuinely Azure-native)
first, but flagged a real risk before building toward it: brand-new Azure
DevOps organizations don't get the free tier (1 parallel job, 1,800
min/month) automatically — Microsoft gates it behind a manual anti-abuse
approval form, 2-3 business days. **This exact subscription had already
hit two similar anti-abuse walls this session** (the `Standard_B2s` VM
quota, `az acr build`'s `TasksOperationsNotAllowed`), so a third was a real
possibility, not hypothetical. The fallback if blocked isn't pay-per-use
either — it's a ~$40/month *subscription* per parallel job, which doesn't
match "only charged when we run." Chose **GitHub Actions** instead — no
equivalent approval gate for private repos, 2,000 free min/month by
default, and the repo (`shukla-surendra/personal_assistant`) was already
on GitHub.

**Built as actual infrastructure, not just a workflow file** — a new
`terraform/cicd/` stage using the `azuread` provider (not `azurerm`;
Entra ID/App Registration resources live in a separate provider):
```hcl
azuread_application "github_actions"                          # the App Registration
azuread_service_principal "github_actions"                     # its Entra identity
azuread_application_federated_identity_credential "github_actions"  # OIDC trust
azurerm_role_assignment "github_actions_acr_push"               # AcrPush, scoped to the ACR only
```
The federated identity credential is the actual point: GitHub Actions
authenticates via **OIDC**, exchanging its own short-lived token for an
Azure AD token at workflow-run time — **no client secret stored anywhere**,
nothing to leak, nothing to rotate. Trust is scoped narrowly:
`subject = "repo:shukla-surendra/personal_assistant:ref:refs/heads/main"`
— only workflow runs dispatched against this exact repo and branch can
assume this identity. This is the same Pattern-B, no-static-keys shape
as the AKS kubelet's Managed Identity pulling from this same ACR
(`terraform/aks-infra/main.tf`'s `AcrPull` role assignment) — see this
doc's very first entries on AWS access keys vs. IAM roles for the fuller
mental model. `AcrPush` only, not `Contributor` or `AcrPull`-and-more —
this identity's entire job is pushing images, nothing else.

Applied for real:
```
azuread_application.github_actions: Creation complete
azuread_service_principal.github_actions: Creation complete
azuread_application_federated_identity_credential.github_actions: Creation complete
azurerm_role_assignment.github_actions_acr_push: Creation complete after 32s
```
Outputs (none of these are secret — they're identifiers, not credentials;
safe to put directly in GitHub Actions *variables*, not *secrets*):
```
azure_client_id       = "06199aab-c1dd-44cf-8634-8277703978e1"
azure_tenant_id       = "0b19a756-b586-402e-bcc6-0640146e652b"
azure_subscription_id = "1f7b45cd-c3f3-487c-8cc6-8eeb3d1ce432"
```

Workflow: `.github/workflows/build-and-push.yml` — `workflow_dispatch`
only (not triggered on every push, so it stays "only charged when we
actually run it" rather than costing minutes on every commit),
`runs-on: ubuntu-latest` (real amd64, no emulation), `azure/login@v2`
using the three vars above, `az acr login`, then a plain `docker build` +
`docker push` per image — the same steps `scripts/build-and-push.sh`
already does locally, just on hardware that doesn't need QEMU.

---

### 2026-09-04 — security fix: two things had already been pushed to the public repo

Asked directly: "are we sharing any credentials publicly, since this is a
public repo." Confirmed via `curl https://api.github.com/repos/.../...`
that it genuinely is public, then audited what was actually tracked —
found two problems **already live on `origin/main`**, not just a future
risk:
- `assistant_web/.env` — a real AWS Lambda Function URL (old/decommissioned,
  confirmed not a live concern, but shouldn't have been committed anyway).
- `terraform/aks-infra/tfplan` and `terraform/application/tfplan` — binary
  saved plan files. The `application` one was concerning since that stage
  passes `postgres_password`/`jwt_secret` as `set_sensitive` values.
  Did a byte-level scan (not just a quick grep) for the exact known secret
  values and any secret-shaped strings in both files — found nothing. A
  real gap regardless: `.gitignore` had `*.tfstate`/`*.tfvars` but never
  `tfplan` — these should never have been committable in the first place.

Fixed (staged, not committed by me — left for direct review/commit):
```bash
# .gitignore: added tfplan / *.tfplan
git rm --cached terraform/aks-infra/tfplan terraform/application/tfplan assistant_web/.env
```
Untracks going forward; doesn't rewrite the *old* commits already on
GitHub that still contain them — a full history scrub (`git filter-repo`
+ force-push) is a separate, more invasive action, not done here since it
rewrites shared public history and wasn't explicitly requested.

**Then rotated `postgres_password`/`jwt_secret` as a zero-cost precaution**,
even with nothing confirmed leaked. This surfaced a real, worth-remembering
gotcha: `terraform apply` with new `set_sensitive` values updates the
Kubernetes *Secret* object's data, but does **not** change the actual
password inside an already-initialized Postgres — the image only reads
`POSTGRES_PASSWORD` once, at first `initdb`. Backend promptly went
`CrashLoopBackOff`: `password authentication failed for user "postgres"`
— the app was now trying the *new* password against a database that still
had the *old* one. Fixed with a direct, live `ALTER USER`:
```bash
kubectl exec -i personal-assistant-postgres-0 -- psql -U postgres \
  -c "ALTER USER postgres WITH PASSWORD '<new-value-from-tfvars>';"
```
No password needed to run that command itself — connecting from *inside*
the pod uses Postgres's local trust auth, not a network connection, so it
doesn't require knowing either the old or new password to get in and set
the new one. All 4 pods back to `1/1 Running` within seconds, verified
with a real signup call through the public LB afterward.

### 2026-09-04 — access + routing, restated plainly

**Reaching the app**: `http://48.206.145.18/` (browser or `curl`) for
everything — the UI and the API share the exact same public entry point,
there's no separate address for "the API."

**What decides frontend vs. backend**: not the Ingress — it has a single
`path: /` rule pointing only at the frontend Service, so `/api/v1/...`
and `/` both get routed to the *same place* by the Load Balancer and
`ingress-nginx`. The actual split happens one hop later, inside the
frontend pod's own nginx (`assistant_web/nginx.conf.template`):
`location /api/` proxies to the backend Service, everything else falls
through to `try_files ... /index.html` (the static React app). Full
diagram + walkthrough already in `docs/architecture.md`'s "In front of
the frontend, or the backend?" section.

### 2026-09-04 — does frontend→backend traffic go through the Load Balancer too?

**No.** The frontend pod's nginx proxies `/api/*` straight to the backend
*Service name* (`personal-assistant-backend`), not to the public IP.
CoreDNS resolves that name to the Service's ClusterIP
(`10.0.100.162`), and `kube-proxy`'s node-level iptables/IPVS rules
rewrite that to an actual backend pod IP (`10.244.0.25`) and route it
there directly over the pod overlay network. No public IP, no internet
hop, no Ingress involved — entirely inside the cluster.

**Could it be routed through the LB instead?** Nothing in Kubernetes
stops a pod from calling a public IP, so yes, mechanically — but it's a
bad idea, illustrating *why* ClusterIP/DNS exists at all:
- It would actually still land on the backend rather than fail: the
  Ingress rule is a catch-all on `/`, so `48.206.145.18/api/...` would
  route to `FrontendSvc` → the same frontend pod → its nginx sees
  `/api/*` → proxies internally to the backend anyway. Same end path,
  just with two pointless hops bolted onto the front.
- It would pass through `ingress-nginx`'s `limit-rps` rate limiter —
  the one meant for *external* users — throttling the app's own
  internal traffic.
- Adds real latency for a call that was already inside the cluster.
- Azure's Standard Load Balancer has a known "hairpin"/loopback
  limitation: a backend-pool member (here, the pod) calling back into
  the LB's own public frontend IP can behave unreliably, since the
  LB's SNAT rules generally assume the caller is external — a
  cloud-networking gotcha, unrelated to this app's own config.

This is exactly why Kubernetes gives every Service a stable internal
ClusterIP + DNS name: pod-to-pod calls never need to leave the cluster,
round-trip through a cloud LB, or depend on public networking at all.

### 2026-09-04 — how does the Load Balancer actually reach a pod?

It doesn't, directly — it only ever talks to a **Node**, on a specific
port. Delivery to the actual pod is `kube-proxy`'s job, one layer further
in. Real values, checked live:
```
ingress-nginx-controller Svc:  ClusterIP 10.0.54.27, EXTERNAL-IP 48.206.145.18
  80:32684/TCP  443:32560/TCP     <- NodePorts, auto-allocated
Node: aks-system-13632577-vmss000000, INTERNAL-IP 10.10.1.4
Endpoints (real pod IP behind the Svc): 10.244.0.13:80, 10.244.0.13:443
```
1. A `type: LoadBalancer` Service auto-allocates a **NodePort** (here
   `32684`/`32560`, from the reserved 30000-32767 range) and opens it on
   *every* node — whether or not that node happens to be running a
   matching pod.
2. `cloud-controller-manager` configures the real Azure LB's backend
   pool = the AKS nodes themselves, with a forwarding rule + health
   probe aimed at that NodePort. The LB's entire model of the world is
   "port 80 → some healthy node, on port 32684" — it has no concept of
   Services, pods, or `ingress-nginx`.
3. Traffic lands on a node (`10.10.1.4:32684`) — the LB's job ends here.
4. `kube-proxy` on that node holds iptables/IPVS rules built from the
   Service's live **Endpoints** list (refreshed continuously off
   readiness-probe results) and DNATs `node-IP:32684` → `pod-IP:80`
   (`10.244.0.13:80`).
5. If the target pod were on a *different* node than the one the LB
   picked, kube-proxy would hop the packet across the node-to-node VNet
   first. This cluster has only 1 node (`node_count = 1` in
   `terraform/aks-infra`) right now, so that cross-node hop never
   actually happens here — but it's the general mechanism.

So: **LB picks a node; `kube-proxy` picks the pod.** An unready pod
drops out of Endpoints automatically, and the LB keeps sending traffic
to the node regardless, trusting `kube-proxy` to route around it.

### 2026-09-04 — moving OPENAI_API_KEY into Azure Key Vault (Workload Identity + CSI driver)

Request: get the OpenAI key out of a plain K8s Secret and have the
backend pod pull it from Key Vault instead. Built as a genuinely new
Terraform stage (`terraform/keyvault/`), applied for real:

**What got built, and why each piece exists:**
- `azurerm_kubernetes_cluster.this` (aks-infra) gained
  `oidc_issuer_enabled`, `workload_identity_enabled`, and a
  `key_vault_secrets_provider` block — the last one is an AKS-managed
  addon that installs the Secrets Store CSI Driver + Azure provider for
  you, no separate Helm chart needed. All three applied as an **in-place
  update** (confirmed via `terraform plan` before applying) — no node or
  cluster replacement, ~3.5 minutes, zero pod disruption.
- `azurerm_key_vault.this` (new `keyvault` stage) — `pa-kv-qlelnf`,
  RBAC-authorization mode (not the older access-policy model), same
  identity+role+scope 3-tuple as every other permission in this project.
- `azurerm_user_assigned_identity.backend` — a dedicated identity for
  *just* the backend workload. Not the AKS cluster's own SystemAssigned
  identity (that one runs the cluster + pulls images via kubelet), not
  shared with anything else.
- `azurerm_federated_identity_credential` — trusts a specific Kubernetes
  ServiceAccount's own OIDC token (`system:serviceaccount:default:
  personal-assistant-backend`) as this Azure identity. Exact same
  Pattern-B, no-stored-secret shape as `terraform/cicd`'s GitHub Actions
  identity — just federated to AKS's own OIDC issuer instead of GitHub's.
- `azurerm_role_assignment` × 2 — "Key Vault Secrets User" for the
  backend identity (read secret values, nothing else), "Key Vault
  Secrets Officer" for *my own* `az login` identity (needed to actually
  write the secret in — RBAC-mode Key Vault has no implicit
  creator-gets-access the way the legacy access-policy model did).

**The raw key itself never touches Terraform at all** — set once,
manually, straight into the vault:
```bash
az keyvault secret set --vault-name pa-kv-qlelnf --name openai-api-key \
  --value "$OPENAI_API_KEY" --output none
```
Not a Terraform resource, not a `.tfvars` line, not `set_sensitive` on
`helm_release` (which is how `postgres_password`/`jwt_secret` still flow
today) — those still end up inside `terraform.tfstate` in plaintext.
This value now exists in exactly one place: the vault itself.

**On the Kubernetes side** (`helm/personal-assistant/templates/`):
- `serviceaccount-backend.yaml` — a ServiceAccount just for this pod,
  annotated `azure.workload.identity/client-id: <the backend identity>`.
- `secretproviderclass.yaml` — tells the CSI driver which vault/secret/
  identity to use, AND has a `secretObjects` block that syncs the
  fetched value into a real K8s Secret
  (`personal-assistant-openai-secret`) — so `backend.yaml`'s
  `OPENAI_API_KEY` env var still just reads a normal `secretKeyRef`,
  completely unaware Key Vault is involved.
- `backend.yaml` — added the `azure.workload.identity/use: "true"` pod
  label (required or the identity webhook ignores the pod entirely),
  `serviceAccountName`, and a CSI volume mount (unused by the app itself
  — mounting it is only what *triggers* the fetch+sync).

**A real failure, and why it wasn't actually a problem**: applied the
Helm upgrade *before* the secret existed in the vault. The new pod sat
in `ContainerCreating` for 5+ minutes with:
```
MountVolume.SetUp failed ... GET https://pa-kv-qlelnf.vault.azure.net/secrets/openai-api-key/
RESPONSE 404: SecretNotFound
```
— a clean 404, not a 403, which was actually a good sign: identity +
federation + RBAC were all already working, it just had nothing to
fetch yet. Terraform's helm-wait hit its default timeout and marked the
release `"failed"`, but **the OLD pod was still `1/1 Running` the whole
time** — a rolling update never tears down the old ReplicaSet until the
new one is ready, so the app stayed up throughout. Once the secret was
set, the stuck pod self-healed in under 20 seconds with no re-apply
needed (kubelet just retries `FailedMount` on its own) — confirmed via
`SecretRotationComplete` in its events. A follow-up `terraform apply`
(0 real changes, ~46s) was still worth doing, purely to flip Helm's own
tracked release status back from `failed` to `deployed` so it wouldn't
confuse a future upgrade.

**Verified for real** — full signup → login → create chat → post
message → trigger completion, through the public LB IP, backend reading
`OPENAI_API_KEY` from the CSI-synced Secret the whole time:
```
POST /api/v1/workspaces/{id}/chats/{id}/completion -> 200 OK
{"content":"OK","role":"assistant",...}
```
