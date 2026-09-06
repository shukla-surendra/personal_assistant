from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EpicDto(BaseModel):
    epic_id: str
    workspace_id: str
    board_id: str
    title: str
    description: Optional[str] = None
    color: str
    status: str
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class EpicDtoMapper:
    @staticmethod
    def map_to_epic_dto(epic) -> EpicDto:
        return EpicDto(
            epic_id=str(epic.epic_id),
            workspace_id=str(epic.workspace_id),
            board_id=str(epic.board_id),
            title=epic.title,
            description=epic.description,
            color=epic.color,
            status=epic.status,
            start_date=epic.start_date,
            due_date=epic.due_date,
            created_at=epic.created_at,
            updated_at=epic.updated_at,
        )
