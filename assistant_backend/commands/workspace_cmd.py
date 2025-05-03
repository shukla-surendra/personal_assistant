from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class WorkspaceCreateCommand(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: str
    members: List[str] = []
    settings: Optional[dict] = None
    properties: Optional[dict] = None


class WorkspaceUpdateCommand(BaseModel):
    workspace_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    members: Optional[List[str]] = None
    settings: Optional[dict] = None
    properties: Optional[dict] = None


class WorkspaceDeleteCommand(BaseModel):
    workspace_id: str
    owner_id: str




