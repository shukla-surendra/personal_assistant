data "azurerm_kubernetes_cluster" "this" {
  name                = var.cluster_name
  resource_group_name = var.resource_group_name
}

# Prometheus + Grafana + Alertmanager + kube-state-metrics + node-exporter,
# bundled as one chart -- the de facto standard way to put this stack on a
# cluster, same "one shared release, not per-app" shape as
# terraform/application's ingress-nginx and KEDA. Cluster-wide: watches
# every namespace, not just personal-assistant's.
resource "helm_release" "kube_prometheus_stack" {
  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = var.namespace
  create_namespace = true

  # Lets the OTel Collector push app metrics straight into Prometheus via
  # remote-write, in addition to Prometheus's own normal scraping -- the
  # path this stack uses for anything instrumented via the OTel SDK rather
  # than a scraped /metrics endpoint.
  set {
    name  = "prometheus.prometheusSpec.enableRemoteWriteReceiver"
    value = "true"
  }
  # Short retention -- this is a learning cluster, not a system of record.
  set {
    name  = "prometheus.prometheusSpec.retention"
    value = "3d"
  }
  # Conservative requests -- a 2-node, 2vCPU/8GB-per-node cluster has no
  # room for this chart's much heavier upstream defaults alongside the app.
  set {
    name  = "prometheus.prometheusSpec.resources.requests.cpu"
    value = "200m"
  }
  set {
    name  = "prometheus.prometheusSpec.resources.requests.memory"
    value = "512Mi"
  }
  set {
    name  = "grafana.resources.requests.cpu"
    value = "50m"
  }
  set {
    name  = "grafana.resources.requests.memory"
    value = "128Mi"
  }
  # Off -- no alert routing (Slack/email/PagerDuty) is configured, so a
  # running Alertmanager with nothing to actually route anywhere is just
  # unused resource cost on a capacity-constrained cluster.
  set {
    name  = "alertmanager.enabled"
    value = "false"
  }

  # Loki + Tempo as additional Grafana datasources -- Prometheus is already
  # auto-wired as the default datasource by this chart itself. Service
  # names/ports match the loki/tempo helm_release names below (both use
  # the chart-name-equals-release-name convention, so no long
  # sub-chart-prefixed name to guess).
  values = [
    yamlencode({
      grafana = {
        additionalDataSources = [
          {
            name      = "Loki"
            type      = "loki"
            url       = "http://loki-gateway.${var.namespace}.svc.cluster.local"
            access    = "proxy"
            isDefault = false
          },
          {
            name      = "Tempo"
            type      = "tempo"
            url       = "http://tempo.${var.namespace}.svc.cluster.local:3200"
            access    = "proxy"
            isDefault = false
          },
        ]
      }
    })
  ]
}

# Log storage. SingleBinary + filesystem -- SimpleScalable/Distributed
# (the chart's other two modes) REQUIRE object storage (S3/Azure Blob),
# which this learning cluster's log volume has no need for.
resource "helm_release" "loki" {
  name             = "loki"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "loki"
  namespace        = var.namespace
  create_namespace = true

  set {
    name  = "deploymentMode"
    value = "SingleBinary"
  }
  set {
    name  = "loki.auth_enabled"
    value = "false"
  }
  # Documented "quickest start" schema for SingleBinary + filesystem --
  # avoids hand-writing a schema_config for a learning deployment.
  set {
    name  = "loki.useTestSchema"
    value = "true"
  }
  set {
    name  = "loki.storage.type"
    value = "filesystem"
  }
  set {
    name  = "singleBinary.replicas"
    value = "1"
  }
  # Chart's default replication_factor is 3 -- with only 1 replica, the
  # ring can never have enough healthy members to satisfy it, and every
  # query fails with "too many unhealthy instances in the ring" (confirmed
  # live in loki-0's own logs). 1 replica needs replication_factor 1.
  set {
    name  = "loki.commonConfig.replication_factor"
    value = "1"
  }
  set {
    name  = "singleBinary.resources.requests.cpu"
    value = "100m"
  }
  set {
    name  = "singleBinary.resources.requests.memory"
    value = "256Mi"
  }
  # deploymentMode alone does NOT gate these out -- confirmed the hard way
  # (chart's own validate.yaml hook refuses to install with non-zero
  # replicas on both SingleBinary and SimpleScalable targets at once).
  # Their non-zero defaults are for SimpleScalable mode; must be zeroed
  # explicitly when using SingleBinary instead.
  set {
    name  = "read.replicas"
    value = "0"
  }
  set {
    name  = "write.replicas"
    value = "0"
  }
  set {
    name  = "backend.replicas"
    value = "0"
  }
  # Both are optional memcached-based performance caches, not required for
  # correctness at this scale -- disabled after chunks-cache's default
  # request couldn't be scheduled on either node (confirmed via
  # `kubectl describe pod`: "Insufficient cpu, Insufficient memory" on
  # both). Loki works fine without them, just without the extra caching
  # layer on repeated/heavy queries -- a real tradeoff for a real capacity
  # constraint, not a functional gap for what this cluster needs to do.
  set {
    name  = "chunksCache.enabled"
    value = "false"
  }
  set {
    name  = "resultsCache.enabled"
    value = "false"
  }
  # Synthetic self-test traffic generator -- adds a DaemonSet with zero
  # functional value toward the actual observability goal. The chart's
  # `helm test` hook hard-requires the canary if test.enabled stays true
  # (confirmed live: "Helm test requires the Loki Canary to be enabled"),
  # so both go together.
  set {
    name  = "lokiCanary.enabled"
    value = "false"
  }
  set {
    name  = "test.enabled"
    value = "false"
  }
}

# Trace storage. This chart IS single-binary by design (see its own
# description: "Grafana Tempo Single Binary Mode") -- no deploymentMode
# equivalent to configure. OTLP receiver (grpc 4317 / http 4318) is enabled
# by default, which is all the OTel Collector needs to push traces here.
# The one piece any app instruments AGAINST -- receives OTLP traces/metrics
# directly from app SDKs (personal_assistant's backend, and any future
# project sharing this cluster), tails every pod's container logs
# cluster-wide via the logsCollection preset, and fans everything out to
# the right backend: traces -> Tempo, metrics -> Prometheus (remote-write),
# logs -> Loki (native OTLP log ingestion, no separate Promtail/Alloy
# DaemonSet needed). DaemonSet mode -- one instance per node, receiving
# from whichever pods happen to land on that same node.
resource "helm_release" "otel_collector" {
  name             = "otel-collector"
  repository       = "https://open-telemetry.github.io/opentelemetry-helm-charts"
  chart            = "opentelemetry-collector"
  namespace        = var.namespace
  create_namespace = true

  set {
    name  = "mode"
    value = "daemonset"
  }
  # Disabled by default for daemonset mode -- app pods need a stable
  # ClusterIP to send OTLP to, not individual node-pinned pod IPs.
  set {
    name  = "service.enabled"
    value = "true"
  }
  # Auto-adds the filelog receiver (+ required volumes/mounts) to the logs
  # pipeline, and the k8s_attributes processor (+ required RBAC) to every
  # pipeline -- hand-rolling either of these correctly is most of the real
  # complexity in a from-scratch OTel Collector config.
  set {
    name  = "presets.logsCollection.enabled"
    value = "true"
  }
  set {
    name  = "presets.kubernetesAttributes.enabled"
    value = "true"
  }
  set {
    name  = "resources.requests.cpu"
    value = "100m"
  }
  set {
    name  = "resources.requests.memory"
    value = "200Mi"
  }
  # Base "otel/opentelemetry-collector" image doesn't include k8sattributes,
  # filelog, or prometheusremotewrite -- those live in the "contrib"
  # distribution only. Required (chart refuses to render without it).
  set {
    name  = "image.repository"
    value = "otel/opentelemetry-collector-contrib"
  }

  values = [
    yamlencode({
      config = {
        exporters = {
          # "otlp_http", not "otlphttp" -- confirmed via this chart's own
          # deprecatedComponentRenames helper (_helpers.tpl): otlphttp is
          # an auto-rewritten deprecated alias for the current name.
          "otlp_http/tempo" = {
            endpoint = "http://tempo.${var.namespace}.svc.cluster.local:4318"
          }
          "otlp_http/loki" = {
            # Loki 3.x's native OTLP ingestion endpoint -- no separate
            # log-shipping agent or Loki-specific exporter needed.
            logs_endpoint = "http://loki-gateway.${var.namespace}.svc.cluster.local/otlp/v1/logs"
          }
          prometheusremotewrite = {
            endpoint = "http://kube-prometheus-stack-prometheus.${var.namespace}.svc.cluster.local:9090/api/v1/write"
          }
        }
        service = {
          pipelines = {
            traces = {
              receivers  = ["otlp"]
              processors = ["memory_limiter", "batch"]
              exporters  = ["otlp_http/tempo"]
            }
            metrics = {
              receivers  = ["otlp", "prometheus"]
              processors = ["memory_limiter", "batch"]
              exporters  = ["prometheusremotewrite"]
            }
            logs = {
              receivers  = ["otlp"]
              processors = ["memory_limiter", "batch"]
              exporters  = ["otlp_http/loki"]
            }
          }
        }
      }
    })
  ]
}

resource "helm_release" "tempo" {
  name             = "tempo"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "tempo"
  namespace        = var.namespace
  create_namespace = true

  set {
    name  = "resources.requests.cpu"
    value = "100m"
  }
  set {
    name  = "resources.requests.memory"
    value = "128Mi"
  }
}
