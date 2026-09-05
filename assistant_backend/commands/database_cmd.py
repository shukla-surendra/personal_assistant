from pydantic import BaseModel
from typing import Optional


class DatabaseCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    title: str
    description: Optional[str] = None
    properties: Optional[dict] = {}


class DatabaseUpdateCommand(BaseModel):
    database_id: Optional[str] = None  # Set from the URL path by the controller
    title: Optional[str] = None
    description: Optional[str] = None
    properties: Optional[dict] = None


class DatabaseDeleteCommand(BaseModel):
    database_id: str
    workspace_id: str


class DatabaseEntryCommand(BaseModel):
    database_id: Optional[str] = None  # Set from the URL path by the controller
    title: str
    content: Optional[dict] = {}
    properties: Optional[dict] = {}


class DatabaseEntryUpdateCommand(BaseModel):
    entry_id: Optional[str] = None  # Set from the URL path by the controller
    title: Optional[str] = None
    content: Optional[dict] = None
    properties: Optional[dict] = None


class DatabaseEntryDeleteCommand(BaseModel):
    entry_id: str
    database_id: str
