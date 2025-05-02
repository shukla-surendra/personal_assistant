import os
import requests
from fastapi import Security, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette import status
from jwt.algorithms import RSAAlgorithm
from fastapi.security.api_key import APIKeyHeader
from config import get_config
from adapters.factory import AdapterFactory, AuthType

COGNITO_REGION = os.getenv("COGNITO_REGION")
USER_POOL_ID = os.getenv("USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"
ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}"

api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

# Fetch and cache the JWKS
jwks = requests.get(JWKS_URL).json()
public_keys = {
    key["kid"]: RSAAlgorithm.from_jwk(key)
    for key in jwks["keys"]
}

security = HTTPBearer()
config = get_config()
auth_adapter = AdapterFactory.get_auth_adapter(AuthType(config.auth_type))

async def get_auth_details(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        user = auth_adapter.verify_token(token)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


class RoleChecker:
    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles

    def __call__(self, user=Depends(get_auth_details)):
        role = user.get("custom:role") or user.get("role")
        if role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Operation not permitted")
        return user
