import os
from typing import List

import jwt
from fastapi import Security, HTTPException, Depends
from fastapi.security.api_key import APIKeyHeader
from starlette import status
from config import get_config

config = get_config()
JWT_SECRET = config.jwt_secret
HEADER_API_KEY_NAME = "Authorization"

api_key_header = APIKeyHeader(name=HEADER_API_KEY_NAME, auto_error=False)

async def get_auth_details(api_key_header: str = Security(api_key_header)):
    if api_key_header:
        auth_type, access_token = api_key_header.split(" ")
        if auth_type == 'Bearer':
            try:
                user = jwt.decode(access_token, JWT_SECRET, algorithms=['HS256'], options={"verify_signature": True})
                user["user_id"] = str(user["sub"])
                return user
            except Exception as exc:
                print(exc)
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Incorrect auth type")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate credentials")

class RoleChecker:
    def __init__(self, allowed_roles: List):
        self.allowed_roles = allowed_roles

    def __call__(self, user: dict = Depends(get_auth_details)):
        if user.get("role") not in self.allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted")
        return user 