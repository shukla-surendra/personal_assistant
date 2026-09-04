# personal-assistant Helm chart

Backend (FastAPI) + frontend (React/nginx) + Postgres (StatefulSet) + Redis,
matching the shape this app already runs in locally via docker-compose.
Schema is Alembic-managed by a migration Job, not created by the app itself
on boot -- see `templates/migration-job.yaml` for why.

## Deploy to minikube

1. Build the images (from the repo root, `personal_assistant/`):

   ```bash
   docker build -t personal-assistant-backend:latest ./assistant_backend
   docker build -t personal-assistant-frontend:latest ./assistant_web
   ```

2. Load them into minikube's node (values.yaml defaults `pullPolicy: Never`,
   so nothing gets pulled from a registry -- these images must already be on
   the node):

   ```bash
   minikube image load personal-assistant-backend:latest
   minikube image load personal-assistant-frontend:latest
   ```

3. Install:

   ```bash
   helm upgrade --install personal-assistant ./helm/personal-assistant \
     --set secrets.openaiApiKey="$OPENAI_API_KEY"
   ```

   (Omit `--set secrets.openaiApiKey` to deploy without one -- chat's
   `/completion` endpoint returns a clean `503` rather than crashing.)

4. Reach it:

   ```bash
   minikube service personal-assistant-frontend --url
   ```

## Re-deploying after a code change

Rebuild the relevant image, `minikube image load` it again, then:

```bash
helm upgrade personal-assistant ./helm/personal-assistant
```

This re-runs the migration Job (`pre-upgrade` hook) before the new backend
pods roll out.

## What's deliberately not here yet

No HPA, PodDisruptionBudget, NetworkPolicy, or resource requests/limits --
`platform-lab/k8s/k8s_explorer/practice/full-stack-app/` already has worked
examples of each of these against a similar 3-tier shape if/when this needs
them. Kept out of this chart's first pass to stay focused on "does the real
app actually work end-to-end in a cluster."
