from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ActivityCommand(BaseModel):
    workspace_id: str
    action: str  # create, update, delete, etc.
    entity_id: str  # ID of the entity
    entity_type: str  # Type of the entity
    user_id: str
    properties: Optional[dict] = None


class ActivityUpdateCommand(BaseModel):
    activity_id: str
    action: Optional[str] = None
    properties: Optional[dict] = None


class ActivityDeleteCommand(BaseModel):
    activity_id: str
    workspace_id: str 