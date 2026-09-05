from typing import List, Dict, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID


class WorkspaceCreateCommand(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: Optional[bool] = False
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


class WorkspaceInviteMemberCommand(BaseModel):
    # Both filled in by the controller from the URL path / auth token
    # AFTER Pydantic validation -- Optional so a client that only sends
    # {email, role} (the real shape the frontend actually sends) doesn't
    # 422 before the controller ever gets a chance to fill these in.
    workspace_id: Optional[str] = None
    owner_id: Optional[str] = None
    email: EmailStr
    role: str = "member"




