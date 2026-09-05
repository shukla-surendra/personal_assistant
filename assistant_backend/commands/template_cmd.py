from pydantic import BaseModel
from typing import Optional, List


class TemplateCommand(BaseModel):
    workspace_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    content: Optional[dict] = None
    properties: Optional[dict] = None
    tags: Optional[List[str]] = None


class TemplateUpdateCommand(BaseModel):
    template_id: Optional[str] = None
    workspace_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    content: Optional[dict] = None
    properties: Optional[dict] = None
    tags: Optional[List[str]] = None


class TemplateDeleteCommand(BaseModel):
    template_id: str
    workspace_id: str
