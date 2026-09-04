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
