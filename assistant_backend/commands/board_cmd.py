from pydantic import BaseModel
from typing import Optional


class BoardCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
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
