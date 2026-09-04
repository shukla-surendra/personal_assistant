# Architecture: how a request from anywhere reaches this app

Every IP, port, and resource name below is real and current as of this
AKS deployment (`personal-assistant-aks` / `personal-assistant-learning`)
— not a generic diagram. Re-check with the commands noted throughout if
anything's been redeployed since.

## The full path, end to end

```
                                    INTERNET
                                        │
                                        │  http://48.206.145.18/
                                        ▼
                       ┌────────────────────────────────┐
                       │  Azure Standard Load Balancer  │  <- OUTSIDE the AKS cluster --
                       │  (auto-created by the          │     a real, separate Azure
                       │   ingress-nginx Service)       │     resource, not a pod
                       └────────────────┬───────────────┘
                                        │  forwards to healthy
                                        │  node(s) on NodePort 32684
                                        ▼
        ┌─────────────────────────────────────────────────────────-----─┐
        │  AKS Node  aks-system-13632577-vmss000000  (10.10.1.4)        │
        │  Standard_D2s_v7, in VNet subnet 10.10.1.0/24                 │
        │                                                               │
        │   ┌────────────────────────────────────────────────────┐      │
        │   │  ingress-nginx-controller pod                         │   │
        │   │  - reads the Ingress resource's rules                 │   │
        │   │  - enforces per-IP rate limiting HERE                 │   │
        │   │    (limit-rps: 10, limit-burst-multiplier: 5)         │   │
        │   │  - path "/" -> personal-assistant-frontend Service    │   │
        │   └───────────────────────┬────────────────────────────┘      │
        │                           │ ClusterIP 10.0.202.224:80         │
        │                           ▼                                   │
        │   ┌────────────────────────────────────────────────────┐      │
        │   │  frontend pod  (10.244.0.20)                          │   │
        │   │  nginx (a SECOND, different nginx -- this app's own  │    │
        │   │  container, not the ingress controller) serves:      │    │
        │   │    /            -> the built React static files      │    │
        │   │    /api/*       -> reverse-proxied to the backend     │   │
        │   └───────────────────────┬────────────────────────────┘      │
        │                           │ ClusterIP 10.0.235.46:8000        │
        │                           ▼                                   │
        │   ┌────────────────────────────────────────────────────┐      │
        │   │  backend pod  (10.244.0.19) -- FastAPI/uvicorn        │   │
        │   └──────┬─────────────────────────────────┬───────────┘      │
        │          │                                  │                 │
        │          ▼                                  ▼                 │
        │   ┌─────────────┐                    ┌─────────────┐          │
        │   │ postgres-0    │                    │ redis pod    │       │
        │   │ (10.244.0.22) │                    │ (10.244.0.21)│       │
        │   │ ClusterIP:    │                    │ ClusterIP:   │       │
        │   │ None (headless│                    │ 10.0.185.80  │       │
        │   │ -- StatefulSet│                    │              │       │
        │   └─────────────┘                    └─────────────┘          │
        └─────────────────────────────────────────────────────────-----─┘

   Postgres and Redis have NO path from outside the cluster at all --
   no LoadBalancer, no NodePort, no Ingress rule references them. The
   only way in is from another pod on the same cluster network.
```

## Is the Load Balancer inside AKS, or outside?

**Outside.** It's a genuine, separate Azure resource
(`Microsoft.Network/loadBalancers`) — not a pod, not a container, nothing
running as part of the Kubernetes cluster itself. Verified directly, not
assumed:

```bash
$ az group list --output table
personal-assistant-registry                                    eastus
personal-assistant-learning                                    eastus   <- our Terraform-managed RG
MC_personal-assistant-learning_personal-assistant-aks_eastus   eastus   <- AKS's own auto-managed RG

$ az network lb list --resource-group MC_personal-assistant-learning_personal-assistant-aks_eastus --output table
Name        ResourceGroup
----------  --------------------------------------------------------------
kubernetes  mc_personal-assistant-learning_personal-assistant-aks_eastus
```

It lives in `MC_*`, **not** in `personal-assistant-learning` (the
resource group `terraform/aks-infra/main.tf` actually manages, which only
holds the AKS cluster *resource*, VNet, and role assignment). AKS
auto-creates and owns this second resource group specifically to hold
every piece of *real infrastructure* the cluster's nodes and Kubernetes
Services actually need under the hood: the VM scale set (the nodes
themselves), this Load Balancer, the public IP attached to it, NICs,
NSGs, and the Managed Disks backing every PVC. This is exactly why the
deployment guide's teardown section says destroying the AKS cluster
*resource* cascades to delete the whole `MC_*` resource group too — the
Load Balancer isn't something `terraform destroy` on `aks-infra` has to
know about explicitly; it goes away as a side effect of the cluster
resource itself going away.

**But it exists *because of* something inside Kubernetes.** Nobody ran
`az network lb create` — AKS's control plane runs a component called the
**cloud-controller-manager**, which watches the Kubernetes API for any
`Service` declared `type: LoadBalancer` (that's exactly what
`ingress-nginx-controller`'s Service is) and automatically provisions a
real Azure Load Balancer to satisfy it, entirely from a Kubernetes-native
action (`helm install ingress-nginx`) with zero direct Azure API calls
from us. This isn't Azure-specific — EKS does the identical thing with a
real ELB/NLB, GKE with its own LB — it's the general pattern every major
managed Kubernetes offering uses to bridge a portable Kubernetes concept
(`type: LoadBalancer`) to whatever the underlying cloud actually provides.

## In front of the frontend, or the backend?

**The frontend only.** The `Ingress` has exactly one rule, matching
*every* path under `/`, pointing at exactly one Service:

```bash
$ kubectl get ingress -o yaml
rules:
- http:
    paths:
    - path: /
      pathType: Prefix
      backend:
        service:
          name: personal-assistant-frontend   # <- always this
          port: {number: 80}
```

Even a request that *looks* backend-shaped, like
`/api/v1/users/signup`, still matches the `/` prefix rule — the Load
Balancer and `ingress-nginx` never look past that. There is no separate
Ingress rule for the backend Service at all; it isn't reachable from
outside the cluster through this path, or through any other public path.

The backend only gets reached via a **second, purely internal hop**,
inside the frontend pod itself: that pod's own nginx (the one from step 5
below, a different process from `ingress-nginx`) inspects the path and
reverse-proxies anything under `/api/` on to the backend Service:
```nginx
# assistant_web/nginx.conf.template
location /api/ {
    proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}/api/;
}
```
So the real shape for an API call is Load Balancer → `ingress-nginx` →
**frontend** Service → frontend pod → (internal proxy) → **backend**
Service → backend pod — the backend is never a first-class stop on the
public path, only ever reached secondhand through the frontend.

## Walking one real request

`curl http://48.206.145.18/api/v1/users/signup -X POST ...`

1. **DNS**: none involved yet — `48.206.145.18` is hit directly (see
   "No domain yet" below). If this had a hostname, this step would be a
   normal public DNS lookup resolving to the same IP.
2. **Azure Standard Load Balancer** receives the packet on its public IP.
   It's a Layer-4 (TCP) load balancer — it doesn't know or care this is
   HTTP, it just forwards to a healthy backend pool member (an AKS node)
   on the `ingress-nginx-controller` Service's NodePort (`32684` for HTTP,
   `32560` for HTTPS — HTTPS isn't actually configured yet, see below).
3. **`ingress-nginx-controller` pod** receives it on the node, having
   registered itself as that NodePort's backend. It reads the cluster's
   `Ingress` resources (`kubectl get ingress -o yaml`) to figure out
   where `/` should go. This is also **where rate limiting actually
   happens** — the `nginx.ingress.kubernetes.io/limit-rps`/
   `limit-burst-multiplier` annotations on the Ingress (set via
   `helm/personal-assistant/values.yaml`'s `ingress.rateLimit` block) are
   config for *this* nginx, not the app's own.
4. Forwarded to the **`personal-assistant-frontend` Service**
   (`ClusterIP`, internal-only virtual IP `10.0.202.224`) — Kubernetes'
   own internal load balancing picks one of that Service's pods (just one
   replica right now).
5. **The frontend pod's own nginx** (a *second*, completely separate
   nginx process from step 3 — easy to conflate, they're different
   containers with different jobs) serves the request. For `/api/*`
   paths specifically, its `nginx.conf.template` (env-substituted at
   container start with `BACKEND_HOST`/`BACKEND_PORT`) reverse-proxies to
   the backend Service instead of serving a static file — this is what
   lets the frontend's JS call relative `/api/...` paths with nothing
   baked into the bundle (see the earlier session-log entry on why that
   matters for portability).
6. **`personal-assistant-backend` Service** (`ClusterIP 10.0.235.46:8000`)
   routes to the FastAPI/uvicorn backend pod.
7. The backend pod talks to **Postgres** (`personal-assistant-postgres`,
   a *headless* Service — `ClusterIP: None` means no virtual IP at all;
   DNS for it resolves directly to the StatefulSet pod's own IP,
   `10.244.0.22`) and **Redis** (`personal-assistant-redis`,
   `10.0.185.80`, used only for the app's own per-user rate limiting —
   `assistant_backend/middleware/rate_limit.py`) — both purely
   cluster-internal, never reachable from outside no matter what.
8. Response flows back out through the same chain in reverse.

## A different kind of traffic: pulling the images in the first place

Separate from any user request — this happens whenever a pod
(re)schedules, e.g. on deploy or node restart:

```
kubelet (on the AKS node) ──AcrPull role, Managed Identity──▶ ACR (personalassistantfoylsi.azurecr.io)
```

No credentials stored anywhere for this — the `AcrPull` role assignment
in `terraform/aks-infra/main.tf` grants the node's own Managed Identity
pull access, verified working end-to-end once the images were rebuilt for
the right CPU architecture (see the session log's "cross-architecture
image builds" entry for why that mattered).

## Two separate IP address spaces, on purpose

```bash
$ kubectl get nodes -o wide      # node's IP: 10.10.1.4   (real VNet address)
$ kubectl get pods -o wide       # pod IPs:   10.244.0.x  (a completely different range)
```

The AKS cluster uses **kubenet**, not Azure CNI (`network_plugin =
"kubenet"` in `terraform/aks-infra/main.tf`, chosen deliberately for a
small subnet — see that file's comment). Under kubenet, pods get IPs from
a separate **overlay** network (`10.244.0.0/16` by default) that has
nothing to do with the VNet's own address space (`10.10.0.0/16`,
subnetted to `10.10.1.0/24` for this node pool). Traffic between a pod and
anything outside the node gets NAT'd through the node's own VNet IP. This
is the same "overlay rides the substrate" mental model from the VNet
learning module (`platform-lab/cloud-practice/azure/docs/vnet/`), just
seen from the Kubernetes-networking side of it instead of the VM side —
under Azure CNI (the other option), pods would instead get real,
directly-routable VNet IPs, at the cost of consuming one VNet IP per pod
(a real constraint on a small `/24` subnet, which is exactly why kubenet
was chosen here).

## No domain, no HTTPS yet — by design, for now

Access today is `http://48.206.145.18/` — a bare public IP, HTTP only.
That was a deliberate choice early on (see `AKS_DEPLOYMENT_GUIDE.md`'s
HTTPS/domain decision): a real TLS cert via `cert-manager` + Let's
Encrypt needs a real domain name pointed at this IP first, which wasn't
available at the time. If/when that changes, it slots into the *same*
`ingress-nginx-controller` layer (step 3 above) — no architecture change,
just a `cert-manager` install + a `tls:` block added to the Ingress + a
DNS `A` record pointed at `48.206.145.18` (or whatever the LB's IP is by
then — it isn't pinned to a static reservation, so it can change if the
Service is ever deleted and recreated).

## Quick verification commands

```bash
kubectl get svc -A                              # every Service + its ClusterIP/type
kubectl get ingress -o yaml                      # the actual routing rules + rate-limit annotations
kubectl get pods -o wide                         # pod IPs, which node they landed on
kubectl get nodes -o wide                        # node's real VNet IP
kubectl get svc -n ingress-nginx ingress-nginx-controller   # the public IP, live
```
