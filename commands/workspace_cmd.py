from typing import List, Dict, Optional
from pydantic import BaseModel


class WorkspaceCreateCommand(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: str
    settings: Optional[Dict] = None
    is_default: bool = False


class WorkspaceUpdateCommand(BaseModel):
    workspace_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict] = None


class WorkspaceDeleteCommand(BaseModel):
    workspace_id: str
    owner_id: str




