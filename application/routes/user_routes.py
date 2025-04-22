from fastapi import APIRouter, HTTPException, status, Depends
from application.handlers.user_handler import UserHandler
from application.common.adapters.auth.jwt_adapter import JWTAdapter
from application.common.adapters.storage.postgresql_adapter import PostgreSQLAdapter
from application.common.adapters.base_factory import BaseAdapterFactory
from application.common.auth import get_auth_details, RoleChecker
from config import get_config, logger

config = get_config()
router = APIRouter()

# Initialize adapters
factory = BaseAdapterFactory()
storage_adapter = factory.get_storage_adapter(config.storage_type)
auth_adapter = JWTAdapter(factory)

# Initialize handler
user_handler = UserHandler(storage_adapter, auth_adapter)

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def sign_up(email: str, password: str, given_name: str, family_name: str):
    try:
        result = await user_handler.sign_up(email, password, given_name, family_name)
        return result
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login")
async def login(email: str, password: str):
    try:
        result = await user_handler.login(email, password)
        return {
            "access_token": result["access_token"],
            "token_type": "bearer",
            "user": result["user"]
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.get("/me")
async def get_current_user(user: dict = Depends(get_auth_details)):
    try:
        return user
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        ) 