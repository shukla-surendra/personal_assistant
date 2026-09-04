#!/usr/bin/env bash
# Builds backend/frontend images and pushes them to ACR -- the same steps
# from AKS_DEPLOYMENT_GUIDE.md Step 2, scripted. ACR login server is
# auto-detected from the container-registry Terraform stage's output
# unless overridden.
#
# Usage:
#   ./scripts/build-and-push.sh [tag] [backend|frontend|all]
#
#   ./scripts/build-and-push.sh              # tag=v1, builds+pushes both
#   ./scripts/build-and-push.sh v2            # tag=v2, both
#   ./scripts/build-and-push.sh v2 backend    # tag=v2, backend only
#
# Env overrides:
#   ACR_LOGIN_SERVER   skip Terraform output auto-detection, use this instead

set -euo pipefail

TAG="${1:-v1}"
TARGET="${2:-all}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -n "${ACR_LOGIN_SERVER:-}" ]; then
  ACR="$ACR_LOGIN_SERVER"
else
  echo "==> Reading ACR login server from terraform/container-registry output..."
  ACR="$(terraform -chdir="$REPO_ROOT/terraform/container-registry" output -raw acr_login_server 2>/dev/null || true)"
  if [ -z "$ACR" ]; then
    echo "ERROR: couldn't read acr_login_server. Either:" >&2
    echo "  - apply terraform/container-registry/ first (see AKS_DEPLOYMENT_GUIDE.md Step 1), or" >&2
    echo "  - set ACR_LOGIN_SERVER=<yourregistry>.azurecr.io yourself" >&2
    exit 1
  fi
fi

case "$TARGET" in
  backend|frontend|all) ;;
  *)
    echo "ERROR: target must be backend, frontend, or all (got: $TARGET)" >&2
    exit 1
    ;;
esac

echo "==> ACR: $ACR"
echo "==> Tag: $TAG"
echo "==> Target: $TARGET"

echo "==> az acr login..."
az acr login --name "${ACR%%.*}"

build_and_push () {
  local name="$1" context="$2"
  echo ""
  echo "==> Building $name (linux/amd64 -- AKS nodes are amd64; on Apple"
  echo "    Silicon, docker builds arm64 by default, which AKS can't run)..."
  docker build --platform linux/amd64 -t "$ACR/personal-assistant-$name:$TAG" "$context"
  echo "==> Pushing $name..."
  docker push "$ACR/personal-assistant-$name:$TAG"
}

case "$TARGET" in
  backend)  build_and_push backend  "$REPO_ROOT/assistant_backend" ;;
  frontend) build_and_push frontend "$REPO_ROOT/assistant_web" ;;
  all)
    build_and_push backend  "$REPO_ROOT/assistant_backend"
    build_and_push frontend "$REPO_ROOT/assistant_web"
    ;;
esac

echo ""
echo "==> Verifying in ACR..."
az acr repository show-tags --name "${ACR%%.*}" --repository personal-assistant-backend --output table 2>/dev/null || true
az acr repository show-tags --name "${ACR%%.*}" --repository personal-assistant-frontend --output table 2>/dev/null || true

echo ""
echo "Done. Images at:"
echo "  $ACR/personal-assistant-backend:$TAG"
echo "  $ACR/personal-assistant-frontend:$TAG"
