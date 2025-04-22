from typing import Optional, Dict, List
from datetime import datetime
import uuid
import logging
from fastapi import HTTPException
from application.common.adapters.storage.postgresql_adapter import PostgreSQLAdapter
from application.common.validators.user_validator import UserValidator

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self.postgresql_adapter = PostgreSQLAdapter()

    def create_user(self, user_data: Dict) -> Dict:
        try:
            # Validate user data
            validated_data = UserValidator(**user_data).dict()
            
            # Create user in PostgreSQL
            user_id = str(uuid.uuid4())
            validated_data['user_id'] = user_id
            validated_data['created_at'] = datetime.utcnow()
            validated_data['updated_at'] = datetime.utcnow()

            # Store in PostgreSQL
            created_user = self.postgresql_adapter.create_user(validated_data)
            return created_user

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error while creating user"
            ) 