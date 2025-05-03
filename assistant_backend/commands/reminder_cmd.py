from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ReminderCommand(BaseModel):
    workspace_id: str
    title: str
    description: Optional[str] = None
    due_date: datetime
    entity_id: str  # ID of the entity to remind about
    entity_type: str  # Type of the entity
    properties: Optional[dict] = None


class ReminderUpdateCommand(BaseModel):
    reminder_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    properties: Optional[dict] = None


class ReminderDeleteCommand(BaseModel):
    reminder_id: str
    workspace_id: str 