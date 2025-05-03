from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class DatabaseEntryDto(BaseModel):
    entry_id: str
    database_id: str
    properties: Dict[str, Any]

class DatabaseDto(BaseModel):
    database_id: str
    workspace_id: str
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    views: Optional[List[Dict[str, Any]]] = None
    is_template: bool = False
    is_public: bool = False
    entries: Optional[List[DatabaseEntryDto]] = None

class DatabaseDtoMapper:
    @staticmethod
    def map_to_database_dto(database) -> DatabaseDto:
        return DatabaseDto(
            database_id=str(database.database_id),
            workspace_id=str(database.workspace_id),
            title=database.title,
            description=database.description,
            icon=database.icon,
            cover=database.cover,
            properties=database.properties,
            views=database.views,
            is_template=database.is_template,
            is_public=database.is_public,
            entries=[DatabaseEntryDtoMapper.map_to_database_entry_dto(entry) for entry in database.entries] if database.entries else None
        )

class DatabaseEntryDtoMapper:
    @staticmethod
    def map_to_database_entry_dto(entry) -> DatabaseEntryDto:
        return DatabaseEntryDto(
            entry_id=str(entry.entry_id),
            database_id=str(entry.database_id),
            properties=entry.properties
        ) 