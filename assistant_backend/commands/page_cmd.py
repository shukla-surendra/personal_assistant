from pydantic import BaseModel
from typing import Optional


class PageCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    title: str
    properties: Optional[dict] = {}


class PageUpdateCommand(BaseModel):
    page_id: Optional[str] = None  # Set from the URL path by the controller
    title: Optional[str] = None
    properties: Optional[dict] = None


class PageDeleteCommand(BaseModel):
    page_id: str
    workspace_id: str


class BlockCommand(BaseModel):
    page_id: Optional[str] = None  # Set from the URL path by the controller
    type: str
    content: dict
    properties: Optional[dict] = {}
    order: Optional[int] = 0


class BlockUpdateCommand(BaseModel):
    block_id: Optional[str] = None  # Set from the URL path by the controller
    type: Optional[str] = None
    content: Optional[dict] = None
    properties: Optional[dict] = None
    order: Optional[int] = None


class BlockDeleteCommand(BaseModel):
    block_id: str
    page_id: str
