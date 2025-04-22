import jwt
from datetime import datetime, timedelta
from typing import Dict
from fastapi import HTTPException, status
from .base import AuthAdapter
from config import get_config
from ..types import StorageType
from ..base_factory import BaseAdapterFactory
import logging

logger = logging.getLogger(__name__)

class JWTAdapter(AuthAdapter):
    def __init__(self, factory: BaseAdapterFactory):
        self.config = get_config()
        self.secret = self.config.jwt_secret
        self.storage = factory.get_storage_adapter(StorageType(self.config.storage_type))

    def register_user(self, email: str, password: str, attributes: Dict) -> str:
        try:
            # Create user with hashed password
            user_data = {
                "email": email,
                "password": password,  # PostgreSQLAdapter will hash this
                **attributes
            }
            user = self.storage.create_user(user_data)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )
            return user["user_id"]
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )

    def authenticate(self, email: str, password: str) -> Dict:
        # Get user from database
        user = self.storage.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Verify password
        if not self.storage.verify_password(user["password_hash"], password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Generate JWT token
        token = self.generate_token(user)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "user_id": user["user_id"],
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "role": user["role"]
            }
        }

    def verify_token(self, token: str) -> Dict:
        try:
            payload = jwt.decode(token, self.secret, algorithms=["HS256"])
            user = self.storage.get_user_by_id(payload["sub"])
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )

    def generate_token(self, user: Dict) -> str:
        """
        Generate a JWT token for the user.
        """
        try:
            # Create token payload with string values
            payload = {
                "sub": str(user['user_id']),  # Convert UUID to string
                "email": user['email'],
                "role": user['role'],
                "exp": datetime.utcnow() + timedelta(days=1)
            }
            
            # Generate token
            token = jwt.encode(payload, self.secret, algorithm="HS256")
            logger.info(f"Generated token for user {user['email']}")
            return token
            
        except Exception as e:
            logger.error(f"Error generating token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate token"
            )

    def delete_user(self, email: str) -> bool:
        """
        Delete a user from the auth system.
        For JWT, this is a no-op since we don't maintain a user registry.
        """
        logger.info(f"JWT adapter: delete_user called for email {email}")
        return True

    # ... implement other methods 