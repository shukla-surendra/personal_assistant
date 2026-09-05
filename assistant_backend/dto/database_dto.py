from pydantic import BaseModel
from typing import Optional, Dict, Any

class DatabaseEntryDto(BaseModel):
    entry_id: str
    database_id: str
    title: str
    content: Optional[Dict[str, Any]] = None
    properties: Optional[Dict[str, Any]] = None

class DatabaseDto(BaseModel):
    database_id: str
    workspace_id: str
    title: str
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class DatabaseDtoMapper:
    @staticmethod
    def map_to_database_dto(database) -> DatabaseDto:
        # Deliberately no `entries` field -- see PageDto/BoardDto for why:
        # lazy-loading a relationship after the handler's temporary session
        # may already be closed. Entries are always fetched through their
        # own endpoint (GET .../databases/{id}/entries) instead.
        return DatabaseDto(
            database_id=str(database.database_id),
            workspace_id=str(database.workspace_id),
            title=database.title,
            description=database.description,
            properties=database.properties
        )

class DatabaseEntryDtoMapper:
    @staticmethod
    def map_to_database_entry_dto(entry) -> DatabaseEntryDto:
        return DatabaseEntryDto(
            entry_id=str(entry.entry_id),
            database_id=str(entry.database_id),
            title=entry.title,
            content=entry.content,
            properties=entry.properties
        )
