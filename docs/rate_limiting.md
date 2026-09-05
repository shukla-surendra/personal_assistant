# Rate Limiting

## Where it's enforced

`assistant_backend/middleware/rate_limit.py` — a custom ASGI middleware
(`RateLimitMiddleware`), registered globally on the FastAPI app in
`main.py`. It runs on every request except `/health`, `/docs`, `/redoc`,
and `/openapi.json`.

## How it works

Fixed-window counter backed by Redis (`REDIS_URL` from `config.settings`,
the same Redis instance the `redis` service in `docker-compose.yml`
provides).

1. **Identify the client** (`_get_client_id`):
   - If the request carries `Authorization: Bearer <token>`, the client
     key is `user:<token>` — the raw token string, not a decoded JWT user
     ID (see caveat below).
   - Otherwise, falls back to IP: `ip:<X-Forwarded-For first entry>`, or
     `ip:<request.client.host>` if no forwarded header is present.
2. **Pick a ceiling** (`_get_rate_limit`): same Bearer-header check
   decides which limit tier applies — authenticated requests get the
   higher ceiling, everything else gets the lower one.
3. **Check and increment** (`_check_rate_limit`): key
   `rate_limit:<client_id>` in Redis, `SETEX` with a 60-second TTL on the
   first request in a window, then `INCR` on each subsequent one. Once
   the counter reaches the ceiling, the request is rejected until the key
   expires (fixed window, not sliding/token-bucket).
4. **On rejection**: `429` with a JSON body —
   `{"status": "error", "message": "Too many requests", "error_code": "RATE_LIMIT_EXCEEDED", "details": {"retry_after": <seconds>}}`.
   `retry_after` is just the Redis key's remaining TTL.

## Current limits

Set in `assistant_backend/middleware/rate_limit.py:14-15`:

| Tier | Limit | Window |
|---|---|---|
| Authenticated (`Authorization: Bearer ...` present) | 300 requests | 60s |
| Unauthenticated | 60 requests | 60s |

These numbers are duplicated in the Swagger-facing description at
`assistant_backend/docs/api_docs.py:52-54` — update both together so
`/docs` doesn't drift from reality.

## Changing the limits

Edit `self.authenticated_limit` / `self.unauthenticated_limit` in
`RateLimitMiddleware.__init__` (`rate_limit.py:14-15`), update the mirrored
numbers in `api_docs.py:52-54`, then rebuild/restart the backend container
(`docker compose up -d --build backend`) — the values are read once at
process start, not per-request.

If a client is stuck against an old limit after a change (a key set under
the previous ceiling with time left on its TTL), clear it manually:

```
docker compose exec redis redis-cli DEL "rate_limit:<client_id>"
# or, to clear all of them:
docker compose exec redis redis-cli --scan --pattern "rate_limit:*" | xargs -r docker compose exec redis redis-cli DEL
```

## Deployed (AKS) environment — a separate, coarser layer

`helm/personal-assistant/values.yaml:88-91` configures an nginx-ingress
rate-limit annotation for the Kubernetes deployment. It is **disabled for
local dev** — `docker compose` traffic never touches it, only the
middleware above applies locally. It operates at the network edge purely
by client IP, with no authenticated/unauthenticated distinction, and acts
as a coarser outer guard in front of whatever the application-level
middleware allows through in production.

## Known limitation

The "authenticated" bucket keys on the raw bearer token string, not a
decoded user ID. Two requests carrying different tokens for the same user
(e.g. before/after a token refresh) get separate counters instead of
sharing one — fine for per-session limiting, but not a true per-user
limit.
