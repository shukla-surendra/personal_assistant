# Infra walkthrough: what Terraform actually builds, stage by stage

This ties the five `terraform/` stages together as one system. It doesn't
repeat what's already covered better elsewhere — see the pointer table at
the bottom for where to go for request-routing detail, the AWS↔Azure
permission model, or the operational runbook.

## The shape of it: 4 runtime components, 5 Terraform stages, 1 Helm chart

The **application** is 4 things running as pods: `frontend` (nginx serving
a built React app), `backend` (FastAPI/uvicorn), `postgres`, `redis`.
Everything else here is the machinery that gets those 4 pods a place to
run, a way to pull their images, and secrets to talk to Postgres/OpenAI.

Terraform is split into 5 independent stages — independent meaning each
has its own state file, and each can be `apply`/`destroy`d separately:

```
container-registry/  →  aks-infra/  →  keyvault/  →  application/
                                 ↘
                              cicd/  (parallel, not in the chain -- feeds
                                      GitHub Actions, not the cluster)
```

Why split at all (this is the one thing worth understanding before
anything else): **an Azure resource group is a deletion blast radius.**
`terraform destroy` on a stage usually means "delete this stage's resource
group," and that cascades to *everything* inside it regardless of which
Terraform state owns which resource. If ACR lived in the same RG as the
AKS cluster, tearing down the cluster to save money mid-week would take
your pushed images with it. So the registry gets its own RG
(`personal-assistant-registry`), and everything cluster-related gets a
second RG (`personal-assistant-learning`). This is a genuinely different
mental model from AWS, where resource groups are just tags with no
deletion semantics — in Azure the RG boundary *is* the blast-radius
boundary.

## Stage 1 — `container-registry/`: the one thing that outlives everything else

```hcl
azurerm_resource_group.this        # "personal-assistant-registry"
azurerm_container_registry.this    # sku = Basic, admin_enabled = false
random_string.acr_suffix           # -> "personalassistantfoylsi" (ACR names
                                    #    are globally unique, like S3 buckets)
```

`admin_enabled = false` is the load-bearing line — there is no
username/password door into this registry at all. The *only* way anything
pulls from it is a Role Assignment (see Stage 2). `AWS_vs_AZURE_PERMISSIONS.md`
walks this exact resource in detail (the ACR-vs-ECR structural difference
is worth reading there — ACR is one resource with repos as implicit
namespaces, ECR is the reverse).

## Stage 2 — `aks-infra/`: the cluster, its network, its money guardrail

```hcl
azurerm_resource_group.this            # "personal-assistant-learning"
azurerm_virtual_network.this           # 10.10.0.0/16
azurerm_subnet.aks                     # 10.10.1.0/24 -- the node's real VNet range
azurerm_kubernetes_cluster.this        # the cluster itself
azurerm_role_assignment.aks_acr_pull   # the ONLY link back to Stage 1
azurerm_consumption_budget_resource_group.this   # email alerts at 50/80/100%
```

Inside `azurerm_kubernetes_cluster.this`, four things matter most for
someone coming from EKS:

- **`identity { type = "SystemAssigned" }`** — Azure mints a Managed
  Identity whose lifecycle is tied to the cluster. This is Azure's answer
  to an EC2 instance profile, but AKS actually exposes *two* identities:
  the cluster's own, and a separate `kubelet_identity` that's what
  actually pulls images. The `AcrPull` role assignment targets
  `kubelet_identity`, not the cluster identity — that's the one line
  connecting Stage 1 and Stage 2.
- **`oidc_issuer_enabled` + `workload_identity_enabled`** — this is what
  lets a *pod* (not the whole node) authenticate to Azure AD as itself,
  via its Kubernetes ServiceAccount token. This is the plumbing Stage 3
  (Key Vault) builds on. Direct EKS analogue: IRSA.
- **`network_profile.network_plugin = "kubenet"`** — pods get IPs from a
  separate overlay range (`10.244.0.x`) instead of eating real VNet IPs.
  On a `/24` subnet this matters; Azure CNI is the "real" choice but would
  burn one VNet IP per pod. `architecture.md` has the live `kubectl`
  output showing the two ranges side by side.
- **`sku_tier = "Free"`** — no control-plane SLA, $0. `Standard` is
  ~$73/month for an SLA a one-week cluster has no use for.

The budget resource is worth a beat: it's evaluated against actual **+
forecasted** cost for the whole `personal-assistant-learning` resource
group, so it can warn you before you're actually over — not just after.

## Stage 3 — `keyvault/`: the OpenAI key's actual home

```hcl
azurerm_key_vault.this                       # rbac_authorization_enabled = true
azurerm_user_assigned_identity.backend       # ONE identity, for the backend pod only
azurerm_federated_identity_credential.backend # trusts system:serviceaccount:default:personal-assistant-backend
azurerm_role_assignment.backend_kv_secrets_user      # backend can READ secrets, nothing else
azurerm_role_assignment.deployer_kv_secrets_officer  # your az-login identity can WRITE secrets
```

This is the cleanest example in the repo of Azure's Pattern-B (no static
keys) idea, and it's a *different* identity from the cluster's own —
deliberately least-privilege per component, same shape as the CI identity
in Stage 5. The federated credential's `subject` is the actual trust
boundary: it says "only a token minted for this exact ServiceAccount, in
this exact namespace, on this exact cluster's OIDC issuer" can become this
identity.

**Gotcha:** a recreated AKS cluster gets a brand-new OIDC issuer URL every
time, so if you tear down `aks-infra` and rebuild it, this stage's
federated credential goes stale silently — Workload Identity auth just
stops working with no obvious error pointing at "the issuer changed."
Reapplying `keyvault` after recreating `aks-infra` fixes it — see
`AKS_DEPLOYMENT_GUIDE.md`'s "Recreating just the cluster" section for the
full destroy-order reasoning.

The actual secret value (`OPENAI_API_KEY`) never touches Terraform — it's
set once by hand with `az keyvault secret set`, specifically so it never
lands in `.tfvars` or `terraform.tfstate`. Contrast: `postgres_password`/
`jwt_secret` in Stage 4 *do* flow through Terraform (`set_sensitive`), and
they end up in plaintext in `terraform.tfstate` regardless of
`set_sensitive`.

## Stage 4 — `application/`: ingress-nginx + the app itself, both via Helm

Two `helm_release` resources, applied in order (`depends_on`):

1. **`ingress_nginx`** — this is the resource that actually gets you a
   public IP. Its Service is `type: LoadBalancer`, which is what triggers
   AKS's `cloud-controller-manager` to provision a real
   `Microsoft.Network/loadBalancers` resource behind the scenes — not a
   pod, a genuine separate Azure object, sitting in a *third*,
   auto-managed resource group
   (`MC_personal-assistant-learning_personal-assistant-aks_eastus`) that
   AKS creates for itself. `architecture.md` walks the full LB → NodePort
   → kube-proxy → pod path live, with real IPs — the best doc in the repo
   for "how does a packet actually get to my pod."
2. **`personal_assistant`** — the app's own chart, pointed at Stage 1's
   ACR (`backend.image.repository`), wired to Stage 3's Key Vault by three
   *non-secret* values (`workloadIdentityClientId`, vault name, tenant ID
   — identifiers, not credentials), and taking `postgres_password`/
   `jwt_secret` as `set_sensitive`.

## Stage 5 — `cicd/`: separate from the cluster chain entirely

```hcl
azuread_application.github_actions
azuread_service_principal.github_actions
azuread_application_federated_identity_credential.github_actions   # subject pinned to repo+branch
azurerm_role_assignment.github_actions_acr_push                    # AcrPush ONLY
```

Note the provider: `azuread`, not `azurerm` — Entra ID/App Registration
objects live in a separate Terraform provider from "regular" Azure
resources. This exists purely so GitHub Actions can push images to ACR
without a stored secret, using the same OIDC-federation pattern as
Stage 3, just federated to GitHub's issuer instead of AKS's.

## What Helm adds on top (not Terraform's job)

`helm/personal-assistant/templates/` is where the 4 pods, their Services,
the Ingress rule, and the migration Job actually get defined — Terraform's
job stops at "here's a chart, here are the values." Worth knowing before
reading those templates: `secretproviderclass.yaml` is what triggers the
Key Vault CSI driver fetch (mounting an unused volume is the trigger, not
the payload), and `backend.yaml`'s `azure.workload.identity/use: "true"`
pod label is required or the identity webhook silently ignores the pod.

## Where to go next

| Question | Doc |
|---|---|
| How does a request actually get from my browser to a pod? | `docs/architecture.md` |
| Why does this Terraform look the way it does vs. the AWS way I know? | `docs/AWS_vs_AZURE_PERMISSIONS.md` |
| What do I actually run, in what order, and how do I tear it down without a surprise bill? | `AKS_DEPLOYMENT_GUIDE.md` |

`AWS_vs_AZURE_PERMISSIONS.md` ends with four questions ("say these back
before we run `terraform apply` for real") — a good self-check once this
walkthrough and the Terraform files themselves have been read.
