from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class BoardCommand(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    properties: Optional[dict] = None


class BoardUpdateCommand(BaseModel):
    board_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    properties: Optional[dict] = None


class BoardDeleteCommand(BaseModel):
    board_id: str
    workspace_id: str


class BoardItemCommand(BaseModel):
    board_id: str
    title: str
    description: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    properties: Optional[dict] = None
    order: Optional[int] = None


class BoardItemUpdateCommand(BaseModel):
    item_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    properties: Optional[dict] = None
    order: Optional[int] = None


class BoardItemDeleteCommand(BaseModel):
    item_id: str
    board_id: str
