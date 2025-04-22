from fastapi import APIRouter, HTTPException
from application.services.user_service import UserService
from application.services.workspace_service import WorkspaceService
from application.models.user import UserCreate, UserLogin
from application.models.user import UserResponse
from application.utils.logger import logger
from passlib.hash import pbkdf2_sha256

router = APIRouter()
user_service = UserService()
workspace_service = WorkspaceService()

@router.post("/login")
def login(login_data: UserLogin):
    try:
        # Get user by email
        user = user_service.get_user_by_email(login_data.email)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Verify password
        if not pbkdf2_sha256.verify(login_data.password, user['password_hash']):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Get user's workspaces
        workspaces = workspace_service.get_user_workspaces(user['user_id'])

        return {
            "error": False,
            "message": "Login successful",
            "status_code": 200,
            "data": {
                "user": {
                    "user_id": user['user_id'],
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name'],
                    "status": user['status'],
                    "role": user['role'],
                    "user_type": user['user_type']
                },
                "workspaces": workspaces
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )

@router.post("/signup", response_model=UserResponse)
def signup(user_data: UserCreate):
    try:
        # Create user
        user = user_service.create_user(user_data.dict())
        
        # Create default workspace
        workspace_data = {
            "name": f"{user['first_name']}'s Workspace",
            "description": "Default workspace",
            "owner_id": user['user_id'],
            "settings": {},
            "system_default": True,
            "is_default": True
        }
        workspace = workspace_service.create_workspace(workspace_data)
        
        return {
            "error": False,
            "message": "User created successfully",
            "status_code": 201,
            "data": {
                "user": user,
                "workspace": workspace
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in signup: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        ) 