from fastapi import APIRouter, Depends, HTTPException, status
from handlers.task_handler import TaskHandler
from authorization.auth import get_auth_details
from config import logger

router = APIRouter(
    prefix="/api/v1/public",
    tags=["public"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
        status.HTTP_403_FORBIDDEN: {"description": "Operation not permitted"},
        status.HTTP_400_BAD_REQUEST: {"description": "Bad request"}
    },
)

@router.get("/notes/{note_id}", status_code=status.HTTP_200_OK)
async def get_public_note(
    note_id: str
):
    """Get a single workspace by ID"""
    try:
        return TaskHandler().get_public_note(note_id = note_id)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting workspace: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workspace")

public_router = router
