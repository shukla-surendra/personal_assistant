from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class PageCommand(BaseModel):
    workspace_id: str
    title: str
    content: Optional[str] = None
    parent_id: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    properties: Optional[dict] = {}
    is_template: bool = False
    is_public: bool = False


class PageUpdateCommand(BaseModel):
    page_id: str
    title: Optional[str] = None
    content: Optional[str] = None
    parent_id: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    properties: Optional[dict] = None
    is_template: Optional[bool] = None
    is_public: Optional[bool] = None


class PageDeleteCommand(BaseModel):
    page_id: str
    workspace_id: str


class BlockCommand(BaseModel):
    page_id: str
    type: str
    content: dict
    parent_id: Optional[str] = None
    properties: Optional[dict] = {}
    order: Optional[int] = 0


class BlockUpdateCommand(BaseModel):
    block_id: str
    type: Optional[str] = None
    content: Optional[dict] = None
    parent_id: Optional[str] = None
    properties: Optional[dict] = None
    order: Optional[int] = None


class BlockDeleteCommand(BaseModel):
    block_id: str
    page_id: str 