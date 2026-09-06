from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EpicCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    board_id: Optional[str] = None  # Set from the URL path by the controller
    title: str
    description: Optional[str] = None
    color: Optional[str] = "#6554C0"
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None


class EpicUpdateCommand(BaseModel):
    epic_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
