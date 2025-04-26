from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from starlette.responses import Response
from application.commands.workspace_cmd import WorkspaceCreateCommand, WorkspaceUpdateCommand
from application.handlers.workspace_handlers import WorkspaceHandler
from application.common.auth import get_auth_details
from config import logger

router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Workspaces"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
        status.HTTP_403_FORBIDDEN: {"description": "Operation not permitted"},
        status.HTTP_400_BAD_REQUEST: {"description": "Bad request"}
    },
)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_cmd: WorkspaceCreateCommand,
    user: dict = Depends(get_auth_details)
):
    """Create a new workspace"""
    try:
        workspace_cmd.owner_id = user.get("user_id")
        return WorkspaceHandler().create_workspace(workspace_cmd)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error creating workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to create workspace")

@router.get("", status_code=status.HTTP_200_OK)
async def list_workspaces(
    user: dict = Depends(get_auth_details)
):
    """List all workspaces owned by the user"""
    try:
        return WorkspaceHandler().list_workspaces(user.get("user_id"))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error listing workspaces: {e}")
        raise HTTPException(status_code=500, detail="Failed to list workspaces")

@router.get("/member-workspaces", status_code=status.HTTP_200_OK)
async def list_member_workspaces(
    user: dict = Depends(get_auth_details)
):
    """List all workspaces where the user is a member"""
    try:
        return WorkspaceHandler().find_workspaces_by_member(user.get("user_id"))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error listing member workspaces: {e}")
        raise HTTPException(status_code=500, detail="Failed to list member workspaces")

@router.get("/workspace/{workspace_id}", status_code=status.HTTP_200_OK)
async def get_workspace(
    workspace_id: str,
    user: dict = Depends(get_auth_details)
):
    """Get a single workspace by ID"""
    try:
        return WorkspaceHandler().get_workspace(workspace_id, user.get("user_id"))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workspace")

@router.put("/workspace/{workspace_id}", status_code=status.HTTP_200_OK)
async def update_workspace(
    workspace_id: str,
    workspace_cmd: WorkspaceUpdateCommand,
    user: dict = Depends(get_auth_details)
):
    """Update an existing workspace"""
    try:
        return WorkspaceHandler().update_workspace(
            workspace_id=workspace_id,
            user_id=user.get("user_id"),
            name=workspace_cmd.workspace_name,
            description=workspace_cmd.description,
            settings=workspace_cmd.settings
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to update workspace")

@router.post("/{workspace_id}/users/{user_id}", status_code=status.HTTP_200_OK)
async def add_user_to_workspace(
    workspace_id: str,
    user_id: str,
    current_user: dict = Depends(get_auth_details)
):
    """Add a user to a workspace"""
    try:
        return WorkspaceHandler().add_user_to_workspace(
            workspace_id=workspace_id,
            owner_id=current_user.get("user_id"),
            user_id=user_id
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error adding user to workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to add user to workspace")

@router.delete("/{workspace_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_workspace(
    workspace_id: str,
    user_id: str,
    current_user: dict = Depends(get_auth_details)
):
    """Remove a user from a workspace"""
    try:
        WorkspaceHandler().remove_user_from_workspace(
            workspace_id=workspace_id,
            owner_id=current_user.get("user_id"),
            user_id=user_id
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error removing user from workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove user from workspace")

@router.get("/{workspace_id}/boards", status_code=status.HTTP_200_OK)
async def get_workspace_boards(
    workspace_id: str,
    user: dict = Depends(get_auth_details)
):
    """Get all boards in a workspace"""
    try:
        return WorkspaceHandler().get_workspace_boards(
            workspace_id=workspace_id,
            user_id=user.get("user_id")
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting workspace boards: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workspace boards")

@router.get("/{workspace_id}/task_list", status_code=status.HTTP_200_OK)
async def get_workspace_tasks(
    workspace_id: str,
    user: dict = Depends(get_auth_details),
    skip: int = 0,
    limit: int = 50
):
    """Get all tasks in a workspace with pagination"""
    try:
        return WorkspaceHandler().get_workspace_tasks(
            workspace_id=workspace_id,
            user_id=user.get("user_id"),
            skip=skip,
            limit=limit
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting workspace tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workspace tasks")

@router.get("/default", status_code=status.HTTP_200_OK)
async def get_default_workspace(
    user: dict = Depends(get_auth_details)
):
    """Get the default workspace for the user"""
    try:
        logger.info(f"######################## Getting default workspace for user_id: {user.get('user_id')}")
        return WorkspaceHandler().get_default_workspace(user.get("user_id"))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting default workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to get default workspace")

@router.put("/{workspace_id}/default", status_code=status.HTTP_200_OK)
async def set_default_workspace(
    workspace_id: str,
    user: dict = Depends(get_auth_details)
):
    """Set a workspace as default for the user"""
    try:
        return WorkspaceHandler().set_default_workspace(workspace_id, user.get("user_id"))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error setting default workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to set default workspace")
