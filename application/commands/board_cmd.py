from pydantic import BaseModel
from typing import List, Optional


class BoardCommand(BaseModel):
    name: str
    workspace_id: Optional[str] # workspace id from path params
    description: str
    users: List
    labels: List
    owner: str


class BoardUpdateCommand(BaseModel):
    board_id: Optional[str]
    name: str
    description: str
    users: List
    labels: List


class BoardDeleteCommand(BaseModel):
    board_id: Optional[str]
    owner: Optional[str]
