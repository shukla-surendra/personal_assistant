#!/bin/sh
set -e

# Applies pending Alembic migrations, then starts the app. Local-dev
# convenience only -- the AKS equivalent is a separate Job/initContainer
# running `alembic upgrade head` before the app Deployment rolls out, not
# baked into the app container's own startup.
alembic upgrade head

exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
