# Observability: Prometheus, Grafana, Loki, Tempo, OTel Collector

Added 2026-09-05, alongside moving the app out of `default` into its own
`personal-assistant` namespace and bumping the node pool to 2. All three
changes shipped together because they're related: this cluster is meant to
host more than one project over time, and a shared observability stack
only makes sense once apps stop colliding in `default`.

## Infra side vs. application side

The stack itself is **infra-side, cluster-wide, shared** — the same shape
as `ingress-nginx` and KEDA (`terraform/application/main.tf`), just broken
out into its own stage (`terraform/observability/`) since it isn't tied to
`personal_assistant`'s own lifecycle. A `terraform destroy` on
`terraform/application` should never be able to take observability down
with it, and a second project sharing this cluster later should reuse this
same stack rather than installing a second copy.

**Application side is thin by design**: `assistant_backend/observability.py`
sends traces + metrics to the shared OTel Collector via OTLP. It does
**not** ship logs — the Collector's `filelog` receiver already tails every
pod's stdout across the whole cluster, cluster-wide, regardless of which
project owns the pod. The only reason logging instrumentation exists in
the app at all is to inject `trace_id`/`span_id` into existing log lines
so they correlate with traces once viewed in Grafana.

```
Backend pod (personal-assistant namespace)
  │ OTLP (traces, metrics) :4318
  ▼
OTel Collector -- DaemonSet, one per node, monitoring namespace
  │                              │                        │
  │ traces                       │ metrics (remote-write)  │ logs (filelog, every pod)
  ▼                              ▼                        ▼
Tempo                        Prometheus                 Loki
  └──────────────┬───────────────┴────────────┬──────────┘
                 Grafana (all three as datasources)
```

## Why each component looks the way it does

| Component | Mode | Why |
|---|---|---|
| Prometheus/Grafana | `kube-prometheus-stack`, Alertmanager off | Standard bundle; Alertmanager disabled since nothing routes alerts anywhere yet -- running it idle is pure resource cost on a capacity-constrained cluster |
| Loki | `SingleBinary`, filesystem storage, `replication_factor: 1` | `SimpleScalable`/`Distributed` (the chart's other 2 modes) **require object storage** -- filesystem is the only option that doesn't mean wiring up another Azure Blob container just for logs |
| Tempo | default (single-binary by design) | This chart doesn't have a deploymentMode choice -- it only ships this way |
| OTel Collector | `DaemonSet`, `logsCollection` + `kubernetesAttributes` presets | One instance per node so app pods send OTLP to a local, low-latency endpoint; presets auto-configure the `filelog` receiver + RBAC instead of hand-rolling both |

## Real gotchas hit standing this up (all confirmed live, not from docs)

**1. Loki's `deploymentMode: SingleBinary` does not zero out the
SimpleScalable `read`/`write`/`backend` replica counts on its own.** The
chart's own `validate.yaml` hook refuses to install with non-zero replicas
configured for both target shapes at once:

```
execution error at (loki/templates/validate.yaml:31:4): You have more
than zero replicas configured for both the single binary and simple
scalable targets.
```

Fix: explicitly set `read.replicas=0`, `write.replicas=0`,
`backend.replicas=0` alongside `deploymentMode: SingleBinary`.

**2. Disabling the Loki canary breaks the chart's `helm test` hook.**
`lokiCanary.enabled=false` alone produces:

```
execution error at (loki/templates/validate.yaml:6:4): Helm test
requires the Loki Canary to be enabled
```

`test.enabled` has to go to `false` in the same change -- the two are
coupled in this chart, not independent toggles.

**3. `chunksCache`/`resultsCache` (Loki's optional memcached-based
caching layers) couldn't be scheduled at all.** `kubectl describe pod`
on the pending pod:

```
0/2 nodes are available: 1 Insufficient cpu, 2 Insufficient memory.
```

A real capacity constraint, not a config mistake -- these are optional
performance layers, not required for correctness at this scale. Disabled
both (`chunksCache.enabled=false`, `resultsCache.enabled=false`).

**4. Loki's default `replication_factor: 3` is incompatible with 1
replica.** Every query failed with `500 too many unhealthy instances in
the ring` -- the ring can never have 3 healthy members when there's only
1 pod. Fix: `loki.commonConfig.replication_factor: 1`. This is the fix
that actually got logs queryable; the first three fixes only got Loki
*installed*, not *working*.

**5. Guessed Tempo's query port as 3100 (Loki's port) -- it's actually
3200.** Confirmed via `helm show values grafana/tempo | grep
http_listen_port`. Grafana's Tempo datasource silently would have pointed
at the wrong port if not caught before applying.

**6. The OTel Collector chart auto-rewrites `otlphttp` to `otlp_http`.**
Naming an exporter `otlphttp/tempo` (the name used in most OTel
documentation/examples) gets silently renamed by this chart's
`deprecatedComponentRenames` helper (`_helpers.tpl`) to `otlp_http/tempo`
-- the "old" name still technically works via auto-rewrite, but the
chart warns it'll stop working in a future release. Used `otlp_http`
directly instead.

**7. The chart refuses to render with no `image.repository` set**, and
the correct one isn't the minimal `otel/opentelemetry-collector` -- it's
`otel/opentelemetry-collector-contrib`, since `k8sattributes`, `filelog`,
and `prometheusremotewrite` all live only in the contrib distribution.

**8. A pre-existing, dead `opentelemetry-api==1.21.0` was already sitting
in `assistant_backend/requirements.txt`** (lines 63-67, alongside unused
`sentry-sdk`/`prometheus-client` entries), left over from an earlier
attempt that was never actually wired into any app code -- confirmed via
grep, zero imports anywhere. It directly conflicted with the new
`opentelemetry-sdk==1.44.0` and friends:

```
ERROR: Cannot install opentelemetry-sdk==1.21.0 and
opentelemetry-sdk==1.44.0 because these package versions have
conflicting dependencies.
```

The lesson here is on me, not the chart: **grep for existing
dependencies of the same family before adding new ones** -- this cost a
full rebuild-and-rediscover cycle that a two-second grep would have
avoided.

## Verifying each pillar independently

Don't trust "the pods are Running" -- query each backend directly.

**Traces (Tempo)**:
```bash
kubectl exec -n monitoring tempo-0 -- true  # confirm pod is actually up
kubectl port-forward -n monitoring svc/tempo 3200:3200
curl "http://localhost:3200/api/search?tags=service.name%3Dpersonal-assistant-backend&limit=5"
```

**Metrics (Prometheus)** -- look for the FastAPI auto-instrumentation's
own emitted metric names, not just `up`:
```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
curl --data-urlencode 'query={__name__=~"http_server.*"}' "http://localhost:9090/api/v1/query"
```

**Logs (Loki)** -- label names are OTel semantic-convention style
(`k8s_namespace_name`, `k8s_container_name`), **not** Promtail-style
(`namespace`, `container`). Confirm available labels first if a query
comes back empty:
```bash
kubectl port-forward -n monitoring svc/loki-gateway 3100:80
curl "http://localhost:3100/loki/api/v1/labels"
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={k8s_namespace_name="personal-assistant", k8s_container_name="backend"}'
```

## Access

No public LB for Grafana -- port-forward, same cost-consciousness as
everything else in this project:

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
kubectl get secret -n monitoring kube-prometheus-stack-grafana -o jsonpath='{.data.admin-password}' | base64 -d
```

Prometheus and Tempo are auto-wired as Grafana datasources by the
`kube-prometheus-stack` chart's `additionalDataSources` value
(`terraform/observability/main.tf`) -- nothing manual needed once the
stack is up.

## App-side instrumentation

`assistant_backend/observability.py`'s `setup_telemetry(app)` is called
once, in `main.py`, right after the `FastAPI()` app object is created and
before any router is included. It's a no-op if
`OTEL_EXPORTER_OTLP_ENDPOINT` isn't set (same graceful-absence pattern as
`adapters/queue`/`adapters/blob`), which is what happens automatically on
minikube or plain `docker-compose` where there's no observability stack at
all.

What it instruments:
- **FastAPI** (`FastAPIInstrumentor`) -- every request becomes a trace
  span, and emits `http_server.*` metrics automatically, no custom
  metrics code needed for basic request/latency visibility.
- **SQLAlchemy** (`SQLAlchemyInstrumentor`) -- every query becomes a
  child span of whatever request triggered it, process-wide (not scoped
  to one engine).
- **`requests`** (`RequestsInstrumentor`) -- any outbound HTTP call
  (OpenAI, Azure SDKs under the hood) becomes a child span too.
- **Logging** (`LoggingInstrumentor`) -- injects `otelTraceID`/
  `otelSpanID` into the standard `logging` format, so a log line and the
  trace it happened during can be cross-referenced in Grafana (Loki logs
  view -> "Tempo" trace link, once a log line's trace ID is visible).

Wiring, `terraform/application/main.tf`:
```hcl
set {
  name  = "backend.env.otelExporterOtlpEndpoint"
  value = var.otel_collector_endpoint   # default: the observability
}                                        # stage's Collector service --
                                         # a separate Terraform stage/state,
                                         # hence a plain default rather than
                                         # a cross-stage output reference.
```

## Terraform layout

```
terraform/observability/
├── versions.tf   # azurerm + kubernetes + helm providers, same auth
│                 # pattern as terraform/application (reads aks-infra's
│                 # kube_config via a data source, no separate kubeconfig)
├── variables.tf  # resource_group_name, cluster_name, namespace (default
│                 # "monitoring"), grafana_admin_password (default null --
│                 # let the chart generate one rather than storing it)
├── main.tf       # 4 helm_release resources: kube_prometheus_stack, loki,
│                 # tempo, otel_collector
└── outputs.tf    # the two kubectl commands under Access above
```

Deliberately its own stage, not folded into `terraform/application` next
to ingress-nginx/KEDA -- observability outlives any single app's own
`terraform destroy`, the same reasoning `terraform/container-registry`
already uses for the shared resource group.
