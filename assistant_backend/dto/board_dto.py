from pydantic import BaseModel
from typing import Optional, Dict, Any

class BoardDto(BaseModel):
    board_id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    views: Optional[Dict[str, Any]] = None

class BoardDtoMapper:
    @staticmethod
    def map_to_board_dto(board) -> BoardDto:
        return BoardDto(
            board_id=str(board.board_id),
            workspace_id=str(board.workspace_id),
            name=board.name,
            description=board.description,
            properties=board.properties,
            views=board.views
        )
