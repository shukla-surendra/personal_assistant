from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class BoardItemDto(BaseModel):
    item_id: str
    board_id: str
    title: str
    description: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    order: Optional[int] = None

class BoardDto(BaseModel):
    board_id: str
    workspace_id: str
    title: str
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    views: Optional[List[Dict[str, Any]]] = None
    is_template: bool = False
    is_public: bool = False
    items: Optional[List[BoardItemDto]] = None

class BoardDtoMapper:
    @staticmethod
    def map_to_board_dto(board) -> BoardDto:
        return BoardDto(
            board_id=str(board.board_id),
            workspace_id=str(board.workspace_id),
            title=board.title,
            description=board.description,
            properties=board.properties,
            views=board.views,
            is_template=board.is_template,
            is_public=board.is_public,
            items=[BoardItemDtoMapper.map_to_board_item_dto(item) for item in board.items] if board.items else None
        )

class BoardItemDtoMapper:
    @staticmethod
    def map_to_board_item_dto(item) -> BoardItemDto:
        return BoardItemDto(
            item_id=str(item.item_id),
            board_id=str(item.board_id),
            title=item.title,
            description=item.description,
            status=item.status,
            assignee_id=str(item.assignee_id) if item.assignee_id else None,
            due_date=item.due_date.isoformat() if item.due_date else None,
            properties=item.properties,
            order=item.order
        ) 