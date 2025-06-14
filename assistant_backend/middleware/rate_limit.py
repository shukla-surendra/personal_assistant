from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import time
import redis
from config import settings
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware:
    def __init__(self, app):
        self.app = app
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.authenticated_limit = 100  # requests per minute
        self.unauthenticated_limit = 20  # requests per minute
        self.window = 60  # 1 minute window

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request = Request(scope)
        # Skip rate limiting for health check and docs
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await self.app(scope, receive, send)

        # Get client identifier (IP or user ID)
        client_id = self._get_client_id(request)
        
        # Get rate limit based on authentication
        limit = self._get_rate_limit(request)
        
        # Check rate limit
        if not self._check_rate_limit(client_id, limit):
            response = JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "message": "Too many requests",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "details": {
                        "retry_after": self._get_retry_after(client_id)
                    }
                }
            )
            await response(scope, receive, send)
            return

        # Process request
        await self.app(scope, receive, send)

    def _get_client_id(self, request: Request) -> str:
        """Get unique identifier for the client."""
        # Try to get user ID from token if authenticated
        try:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                # In a real implementation, you would decode the JWT and get the user ID
                # For now, we'll use the token itself as the identifier
                return f"user:{auth_header.split(' ')[1]}"
        except Exception:
            pass

        # Fallback to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        return f"ip:{request.client.host}"

    def _get_rate_limit(self, request: Request) -> int:
        """Get rate limit based on authentication status."""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return self.authenticated_limit
        return self.unauthenticated_limit

    def _check_rate_limit(self, client_id: str, limit: int) -> bool:
        """Check if the client has exceeded their rate limit."""
        key = f"rate_limit:{client_id}"
        current = self.redis_client.get(key)
        
        if current is None:
            # First request in the window
            self.redis_client.setex(key, self.window, 1)
            return True
        
        current = int(current)
        if current >= limit:
            return False
        
        # Increment counter
        self.redis_client.incr(key)
        return True

    def _get_remaining_requests(self, client_id: str, limit: int) -> int:
        """Get remaining requests for the client."""
        key = f"rate_limit:{client_id}"
        current = self.redis_client.get(key)
        if current is None:
            return limit
        return max(0, limit - int(current))

    def _get_reset_time(self, client_id: str) -> int:
        """Get time until rate limit resets."""
        key = f"rate_limit:{client_id}"
        ttl = self.redis_client.ttl(key)
        return max(0, ttl)

    def _get_retry_after(self, client_id: str) -> int:
        """Get time until client can make another request."""
        return self._get_reset_time(client_id) 