data "azurerm_kubernetes_cluster" "this" {
  name                = var.cluster_name
  resource_group_name = var.resource_group_name
}

# Open-source, free, deployed via Helm -- this is what actually gets you a
# public Azure Load Balancer + IP (its Service is type: LoadBalancer) and is
# what enforces the per-IP rate limits set as annotations on the app's own
# Ingress (see helm/personal-assistant/templates/ingress.yaml). Azure
# Application Gateway + WAF is the more "Azure-native" alternative but costs
# meaningfully more (~$41+/week vs. the Standard LB's ~$4/week) and isn't
# needed for a week of learning.
resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true

  # Explicit, conservative requests -- the 2x Standard_B2s (4GB each) node
  # pool doesn't have room to spare for a controller running with whatever
  # the chart's upstream defaults happen to be this release.
  set {
    name  = "controller.resources.requests.cpu"
    value = "100m"
  }
  set {
    name  = "controller.resources.requests.memory"
    value = "128Mi"
  }
  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }
}

resource "helm_release" "personal_assistant" {
  name  = "personal-assistant"
  chart = "${path.module}/../../helm/personal-assistant"

  # Waits for ingress-nginx's public IP/LB to exist first -- otherwise the
  # app's own Ingress would be created against an ingress class with no
  # controller behind it yet.
  depends_on = [helm_release.ingress_nginx]

  set {
    name  = "backend.image.repository"
    value = "${var.acr_login_server}/personal-assistant-backend"
  }
  set {
    name  = "backend.image.tag"
    value = var.backend_image_tag
  }
  set {
    name  = "backend.image.pullPolicy"
    value = "IfNotPresent"
  }
  set {
    name  = "frontend.image.repository"
    value = "${var.acr_login_server}/personal-assistant-frontend"
  }
  set {
    name  = "frontend.image.tag"
    value = var.frontend_image_tag
  }
  set {
    name  = "frontend.image.pullPolicy"
    value = "IfNotPresent"
  }
  set {
    name  = "ingress.enabled"
    value = "true"
  }

  set_sensitive {
    name  = "secrets.postgresPassword"
    value = var.postgres_password
  }
  set_sensitive {
    name  = "secrets.jwtSecret"
    value = var.jwt_secret
  }
  set_sensitive {
    name  = "secrets.openaiApiKey"
    value = var.openai_api_key
  }
}
