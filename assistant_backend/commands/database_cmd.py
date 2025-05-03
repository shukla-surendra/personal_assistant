from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class DatabaseCommand(BaseModel):
    workspace_id: str
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    properties: Optional[dict] = {}
    views: Optional[List[dict]] = []
    is_template: bool = False
    is_public: bool = False


class DatabaseUpdateCommand(BaseModel):
    database_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    properties: Optional[dict] = None
    views: Optional[List[dict]] = None
    is_template: Optional[bool] = None
    is_public: Optional[bool] = None


class DatabaseDeleteCommand(BaseModel):
    database_id: str
    workspace_id: str


class DatabaseEntryCommand(BaseModel):
    database_id: str
    properties: dict


class DatabaseEntryUpdateCommand(BaseModel):
    entry_id: str
    properties: dict


class DatabaseEntryDeleteCommand(BaseModel):
    entry_id: str
    database_id: str 