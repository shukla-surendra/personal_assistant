from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class TemplateCommand(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    type: str  # page, database, board, etc.
    content: dict
    is_public: bool = False


class TemplateUpdateCommand(BaseModel):
    template_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    content: Optional[dict] = None
    is_public: Optional[bool] = None


class TemplateDeleteCommand(BaseModel):
    template_id: str
    workspace_id: str 