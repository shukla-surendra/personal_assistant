from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class CommentCommand(BaseModel):
    workspace_id: str
    content: str
    parent_id: str  # ID of the parent entity (page, task, etc.)
    parent_type: str  # Type of the parent entity
    properties: Optional[dict] = None


class CommentUpdateCommand(BaseModel):
    comment_id: str
    content: Optional[str] = None
    properties: Optional[dict] = None


class CommentDeleteCommand(BaseModel):
    comment_id: str
    workspace_id: str 