from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class CommentCommand(BaseModel):
    workspace_id: str
    content: str
    user_id: str
    task_id: str


class CommentUpdateCommand(BaseModel):
    comment_id: str
    content: Optional[str] = None
    properties: Optional[dict] = None


class CommentDeleteCommand(BaseModel):
    comment_id: str
    workspace_id: str 