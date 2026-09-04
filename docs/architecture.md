# Architecture: how a request from anywhere reaches this app

This explains, in order, everything that happens between "someone types
`http://48.206.145.18/` in a browser" and "they see the app." Every name,
IP, and port below is real and current for this deployment — check with
the commands at the bottom if anything's been redeployed since.

## The big picture

```mermaid
flowchart TB
    Client["🌐 Someone on the internet<br/>e.g. your browser"]

    subgraph Azure["☁️ Azure — outside the AKS cluster"]
        LB["Azure Standard Load Balancer<br/>Public IP: 48.206.145.18<br/><i>a real Azure resource, not a pod</i>"]
    end

    subgraph AKS["☸️ Inside the AKS cluster (personal-assistant-aks)"]
        subgraph NS_ingress["namespace: ingress-nginx"]
            Ingress["ingress-nginx-controller pod<br/><i>reads the Ingress rule, enforces rate limiting</i>"]
        end

        subgraph NS_default["namespace: default"]
            FrontendSvc["Service: personal-assistant-frontend<br/>ClusterIP 10.0.232.70:80"]
            FrontendPod["frontend pod<br/>nginx serving the built React app<br/><i>a DIFFERENT nginx from ingress-nginx above</i>"]
            BackendSvc["Service: personal-assistant-backend<br/>ClusterIP 10.0.100.162:8000"]
            BackendPod["backend pod<br/>FastAPI / uvicorn"]
            PostgresSvc["Service: personal-assistant-postgres<br/>headless — no ClusterIP at all"]
            Postgres[("Postgres<br/>personal-assistant-postgres-0")]
            RedisSvc["Service: personal-assistant-redis<br/>ClusterIP 10.0.216.154:6379"]
            Redis[("Redis")]
        end
    end

    Client -->|"1 HTTP request"| LB
    LB -->|"2 forwards to a healthy node<br/>on NodePort 32684"| Ingress
    Ingress -->|"3 Ingress rule: path / → frontend"| FrontendSvc
    FrontendSvc --> FrontendPod
    FrontendPod -->|"4 ONLY for paths under /api/*<br/>(internal reverse proxy)"| BackendSvc
    BackendSvc --> BackendPod
    BackendPod -->|"5"| PostgresSvc --> Postgres
    BackendPod -->|"5"| RedisSvc --> Redis

    style Client fill:#e8f4fd,stroke:#2b6cb0,color:#1a365d
    style LB fill:#fff3cd,stroke:#b7791f,color:#5c3d00
    style Ingress fill:#e6fffa,stroke:#2c7a7b,color:#1d4044
    style FrontendPod fill:#faf5ff,stroke:#6b46c1,color:#3b2263
    style BackendPod fill:#faf5ff,stroke:#6b46c1,color:#3b2263
    style Postgres fill:#f0fff4,stroke:#2f855a,color:#1c4532
    style Redis fill:#f0fff4,stroke:#2f855a,color:#1c4532
```

**Two things this diagram is deliberately showing, that are easy to miss:**

1. **The Load Balancer box is drawn *outside* the "Inside AKS cluster" box, on purpose.** It's a real, separate Azure resource — not a pod, not part of the cluster. More on this below.
2. **`ingress-nginx` and the `frontend` pod's nginx are two completely different programs**, running in different pods, doing different jobs. Seeing "nginx" twice in this diagram is not a mistake.

Postgres and Redis have **no arrows coming in from outside the `AKS` box at all** — there's no path to them except from the backend pod, on the cluster's internal network. Nothing external can ever reach them directly, no matter what URL is tried.

## Walking one real request, step by step

This is the exact same picture as above, but drawn as a *sequence* — who
talks to whom, **in order**, for one concrete request:
`POST /api/v1/users/signup`.

```mermaid
sequenceDiagram
    actor You
    participant LB as Azure Load Balancer
    participant IN as ingress-nginx
    participant FE as frontend pod's nginx
    participant BE as backend pod - FastAPI
    participant PG as Postgres

    You->>LB: POST /api/v1/users/signup
    Note over LB: Layer-4 TCP only -- doesn't know<br/>or care that this is HTTP
    LB->>IN: forward to a healthy node
    Note over IN: Checks the Ingress rule --<br/>path "/" always goes to the frontend Service<br/>there is no rule for the backend
    IN->>FE: forward, still routed as "the frontend"
    Note over FE: Looks at the PATH itself --<br/>"/api/*" is proxied to the backend<br/>anything else is served as static files
    FE->>BE: proxy_pass /api/v1/users/signup
    BE->>PG: INSERT INTO users ...
    PG-->>BE: new user row
    BE-->>FE: 201 Created, user JSON
    FE-->>IN: same response, passed through
    IN-->>LB: same response, passed through
    LB-->>You: 201 Created, user JSON
```

The takeaway: **the Ingress never actually looks at `/api/`** — it only
ever sees `/`, because that's the only rule that exists. The real
frontend-vs-backend decision happens one step later than most people
expect, inside the frontend pod itself.

## Is the Load Balancer inside AKS, or outside?

**Outside.** It's a genuine, separate Azure resource
(`Microsoft.Network/loadBalancers`) — not a pod, not a container, nothing
running as part of the Kubernetes cluster. Verified directly:

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

It lives in `MC_*` — AKS's own auto-managed resource group, completely
separate from `personal-assistant-learning` (the one our Terraform
actually owns, holding just the AKS cluster *resource*, the VNet, and one
role assignment). AKS creates this second resource group automatically to
hold every piece of *real infrastructure* the cluster needs: the VM(s)
themselves, this Load Balancer, the public IP, network cards, and the
disks backing Postgres's storage.

**But it exists *because of* something inside Kubernetes.** Nobody ran
`az network lb create` by hand. AKS's control plane runs a component
called the **cloud-controller-manager**, which watches for any Kubernetes
`Service` declared `type: LoadBalancer` — that's exactly what
`ingress-nginx-controller`'s Service is — and automatically creates a real
Azure Load Balancer to satisfy it. This isn't Azure-specific: EKS does the
same thing with a real AWS ELB/NLB, GKE with its own LB. It's the general
pattern every managed Kubernetes offering uses to connect a portable
Kubernetes idea (`type: LoadBalancer`) to whatever the cloud actually has.

## Two separate IP ranges, and why that's intentional

```bash
$ kubectl get nodes -o wide      # node's IP: 10.10.1.4    (a real VNet address)
$ kubectl get pods -o wide       # pod IPs:   10.244.0.x   (a totally different range)
```

The node's IP (`10.10.1.4`) comes from the VNet Terraform created
(`10.10.0.0/16`, subnetted to `10.10.1.0/24`). The pods' IPs
(`10.244.0.x`) come from something else entirely: AKS's default pod
network. This cluster uses **kubenet**, which gives every pod an address
from a separate overlay range that has nothing to do with the VNet. The
node quietly translates traffic between the two ranges as it comes and
goes. (The alternative, Azure CNI, gives every pod a real VNet address
instead — at the cost of eating one VNet IP per pod, which matters on a
small `/24` subnet like this one. That's why kubenet was chosen here.)

## No domain, no HTTPS yet — a deliberate choice, not an oversight

Access today is plain `http://48.206.145.18/`. Getting real HTTPS needs a
domain name pointed at this IP first (for `cert-manager` + Let's Encrypt
to issue a certificate for it) — that wasn't available when this was set
up, so HTTP-only was chosen deliberately as the starting point. Adding it
later doesn't change any of the architecture above — it slots into the
`ingress-nginx` layer (step 3 in the sequence diagram) as a
`cert-manager` install plus a `tls:` block on the existing Ingress.

## Quick verification commands

```bash
kubectl get svc -A                              # every Service + its ClusterIP/type
kubectl get ingress -o yaml                      # the actual routing rule + rate-limit annotations
kubectl get pods -o wide                         # pod IPs, which node they're on
kubectl get nodes -o wide                        # the node's real VNet IP
kubectl get svc -n ingress-nginx ingress-nginx-controller   # the public IP, live
```
