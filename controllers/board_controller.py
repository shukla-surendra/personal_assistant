from fastapi import APIRouter, Depends, Request, HTTPException
from starlette import status
from starlette.responses import Response
from application.common.auth import get_auth_details
from application.handlers.board_handler import BoardHandler
from application.commands.board_cmd import BoardCommand, BoardUpdateCommand, BoardDeleteCommand
from config import logger


router = APIRouter(
    prefix="/api/v1/boards",
    tags=["Boards"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
        status.HTTP_403_FORBIDDEN: {"description": "Operation not permitted"},
        status.HTTP_400_BAD_REQUEST: {"description": "Bad request"}
    },
)


@router.post("/{workspace_id}", status_code=status.HTTP_201_CREATED)
async def create_board(
    workspace_id: str,
    board_cmd: BoardCommand,
    user: dict = Depends(get_auth_details)
):
    """Create a new board in DynamoDB"""
    try:
        board_cmd.workspace_id = workspace_id
        board_cmd.owner = user.get("user_id")
        return BoardHandler().create_board(board_cmd)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error creating board: {e}")
        raise HTTPException(status_code=500, detail="Failed to create board")


@router.get("/workspace/{workspace_id}", status_code=status.HTTP_200_OK)
async def list_boards(
    workspace_id: str,
    user: dict = Depends(get_auth_details)
):
    """List all boards in a workspace that the user has access to"""
    try:
        return BoardHandler().list_boards(
            workspace_id=workspace_id,
            user_id=user.get("user_id")
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error listing boards: {e}")
        raise HTTPException(status_code=500, detail="Failed to list boards")


@router.get("/{board_id}", status_code=status.HTTP_200_OK)
async def get_board(
    board_id: str,
    user: dict = Depends(get_auth_details)
):
    """Get a single board by ID"""
    try:
        return BoardHandler().get_board(
            board_id=board_id,
            user_id=user.get("user_id")
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting board: {e}")
        raise HTTPException(status_code=500, detail="Failed to get board")


@router.put("/{board_id}", status_code=status.HTTP_200_OK)
async def update_board(
    board_id: str,
    board_cmd: BoardUpdateCommand,
    user: dict = Depends(get_auth_details)
):
    """Update an existing board"""
    try:
        board_cmd.board_id = board_id
        board_cmd.owner = user.get("user_id")
        return BoardHandler().update_board(board_cmd)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating board: {e}")
        raise HTTPException(status_code=500, detail="Failed to update board")


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: str,
    user: dict = Depends(get_auth_details)
):
    """Soft delete a board"""
    try:
        board_cmd = BoardDeleteCommand(
            board_id=board_id,
            owner=user.get("user_id")
        )
        BoardHandler().delete_board(board_cmd)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting board: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete board")


@router.post("/{board_id}/users/{user_id}", status_code=status.HTTP_200_OK)
async def add_user_to_board(
    board_id: str,
    user_id: str,
    current_user: dict = Depends(get_auth_details)
):
    """Add a user to a board"""
    try:
        return BoardHandler().add_user_to_board(
            board_id=board_id,
            owner_id=current_user.get("user_id"),
            user_id=user_id
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error adding user to board: {e}")
        raise HTTPException(status_code=500, detail="Failed to add user to board")


@router.delete("/{board_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_board(
    board_id: str,
    user_id: str,
    current_user: dict = Depends(get_auth_details)
):
    """Remove a user from a board"""
    try:
        BoardHandler().remove_user_from_board(
            board_id=board_id,
            owner_id=current_user.get("user_id"),
            user_id=user_id
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error removing user from board: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove user from board")


@router.get("/{board_id}/tasks", status_code=status.HTTP_200_OK)
async def get_board_tasks(
    board_id: str,
    user: dict = Depends(get_auth_details)
):
    """Get all tasks in a board"""
    try:
        board, tasks = BoardHandler().get_board_with_tasks(
            user_id=user.get("user_id"),
            board_id=board_id
        )
        return {
            "board": board,
            "tasks": tasks
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting board tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to get board tasks")
