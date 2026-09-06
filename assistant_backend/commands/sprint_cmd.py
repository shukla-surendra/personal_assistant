from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SprintCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    board_id: Optional[str] = None  # Set from the URL path by the controller
    name: str
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SprintUpdateCommand(BaseModel):
    sprint_id: Optional[str] = None
    name: Optional[str] = None
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
