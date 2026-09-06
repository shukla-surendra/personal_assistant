from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SprintDto(BaseModel):
    sprint_id: str
    workspace_id: str
    board_id: str
    name: str
    goal: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class SprintDtoMapper:
    @staticmethod
    def map_to_sprint_dto(sprint) -> SprintDto:
        return SprintDto(
            sprint_id=str(sprint.sprint_id),
            workspace_id=str(sprint.workspace_id),
            board_id=str(sprint.board_id),
            name=sprint.name,
            goal=sprint.goal,
            status=sprint.status,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            created_at=sprint.created_at,
            updated_at=sprint.updated_at,
        )
