from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from starlette.responses import Response
from authorization.auth import get_auth_details
from handlers.board_handler import BoardHandler
from commands.board_cmd import BoardCommand, BoardUpdateCommand, BoardDeleteCommand, BoardItemCommand, BoardItemUpdateCommand, BoardItemDeleteCommand
from adapters.orm.models.pg_models import Board, BoardItem
from dto.board_dto import BoardDto, BoardItemDto
from dto.board_dto import BoardDtoMapper, BoardItemDtoMapper
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


@router.post("/", response_model=BoardDto, status_code=status.HTTP_201_CREATED)
async def create_board(command: BoardCommand):
    """Create a new board in DynamoDB"""
    handler = BoardHandler()
    try:
        board = handler.create_board(command)
        return BoardDtoMapper.map_to_board_dto(board)
    except Exception as e:
        logger.error(f"Error creating board: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[BoardDto])
async def list_boards(workspace_id: str):
    """List all boards in a workspace that the user has access to"""
    handler = BoardHandler()
    try:
        boards = handler.list_boards(workspace_id)
        return [BoardDtoMapper.map_to_board_dto(board) for board in boards]
    except Exception as e:
        logger.error(f"Error listing boards: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{board_id}", response_model=BoardDto)
async def get_board(board_id: str):
    """Get a single board by ID"""
    handler = BoardHandler()
    try:
        board = handler.get_board(board_id)
        return BoardDtoMapper.map_to_board_dto(board)
    except Exception as e:
        logger.error(f"Error getting board: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{board_id}", response_model=BoardDto)
async def update_board(board_id: str, command: BoardUpdateCommand):
    """Update an existing board"""
    handler = BoardHandler()
    try:
        command.board_id = board_id
        board = handler.update_board(command)
        return BoardDtoMapper.map_to_board_dto(board)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating board: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(board_id: str, workspace_id: str):
    """Soft delete a board"""
    handler = BoardHandler()
    try:
        command = BoardDeleteCommand(board_id=board_id, workspace_id=workspace_id)
        handler.delete_board(command)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting board: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{board_id}/users/{user_id}", status_code=status.HTTP_200_OK)
async def add_user_to_board(
    board_id: str,
    user_id: str,
    current_user: dict = Depends(get_auth_details)
):
    """Add a user to a board"""
    handler = BoardHandler()
    try:
        return handler.add_user_to_board(
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
    handler = BoardHandler()
    try:
        handler.remove_user_from_board(
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
    handler = BoardHandler()
    try:
        board, tasks = handler.get_board_with_tasks(
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


# Board Item endpoints
@router.post("/{board_id}/items", response_model=BoardItemDto, status_code=status.HTTP_201_CREATED)
async def create_board_item(board_id: str, command: BoardItemCommand):
    handler = BoardHandler()
    try:
        command.board_id = board_id
        item = handler.create_board_item(command)
        return BoardItemDtoMapper.map_to_board_item_dto(item)
    except Exception as e:
        logger.error(f"Error creating board item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{board_id}/items/{item_id}", response_model=BoardItemDto)
async def update_board_item(board_id: str, item_id: str, command: BoardItemUpdateCommand):
    handler = BoardHandler()
    try:
        command.item_id = item_id
        item = handler.update_board_item(command)
        return BoardItemDtoMapper.map_to_board_item_dto(item)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating board item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{board_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board_item(board_id: str, item_id: str):
    handler = BoardHandler()
    try:
        command = BoardItemDeleteCommand(item_id=item_id, board_id=board_id)
        handler.delete_board_item(command)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting board item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{board_id}/items", response_model=List[BoardItemDto])
async def list_board_items(board_id: str):
    handler = BoardHandler()
    try:
        items = handler.list_board_items(board_id)
        return [BoardItemDtoMapper.map_to_board_item_dto(item) for item in items]
    except Exception as e:
        logger.error(f"Error listing board items: {e}")
        raise HTTPException(status_code=500, detail=str(e))
