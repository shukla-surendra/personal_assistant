from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from handlers.database_handler import DatabaseHandler
from commands.database_cmd import DatabaseCommand, DatabaseUpdateCommand, DatabaseDeleteCommand, DatabaseEntryCommand, DatabaseEntryUpdateCommand, DatabaseEntryDeleteCommand
from adapters.orm.models.pg_models import Database, DatabaseEntry
from dto.database_dto import DatabaseDto, DatabaseEntryDto
from dto.database_dto import DatabaseDtoMapper, DatabaseEntryDtoMapper

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/databases", tags=["databases"])

@router.post("/", response_model=DatabaseDto, status_code=status.HTTP_201_CREATED)
async def create_database(command: DatabaseCommand):
    handler = DatabaseHandler()
    try:
        database = handler.create_database(command)
        return DatabaseDtoMapper.map_to_database_dto(database)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{database_id}", response_model=DatabaseDto)
async def update_database(database_id: str, command: DatabaseUpdateCommand):
    handler = DatabaseHandler()
    try:
        command.database_id = database_id
        database = handler.update_database(command)
        return DatabaseDtoMapper.map_to_database_dto(database)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{database_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_database(database_id: str, workspace_id: str):
    handler = DatabaseHandler()
    try:
        command = DatabaseDeleteCommand(database_id=database_id, workspace_id=workspace_id)
        handler.delete_database(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{database_id}", response_model=DatabaseDto)
async def get_database(database_id: str):
    handler = DatabaseHandler()
    try:
        database = handler.get_database(database_id)
        return DatabaseDtoMapper.map_to_database_dto(database)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[DatabaseDto])
async def list_databases(workspace_id: str):
    handler = DatabaseHandler()
    try:
        databases = handler.list_databases(workspace_id)
        return [DatabaseDtoMapper.map_to_database_dto(database) for database in databases]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Database Entry endpoints
@router.post("/{database_id}/entries", response_model=DatabaseEntryDto, status_code=status.HTTP_201_CREATED)
async def create_database_entry(database_id: str, command: DatabaseEntryCommand):
    handler = DatabaseHandler()
    try:
        command.database_id = database_id
        entry = handler.create_database_entry(command)
        return DatabaseEntryDtoMapper.map_to_database_entry_dto(entry)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{database_id}/entries/{entry_id}", response_model=DatabaseEntryDto)
async def update_database_entry(database_id: str, entry_id: str, command: DatabaseEntryUpdateCommand):
    handler = DatabaseHandler()
    try:
        command.entry_id = entry_id
        entry = handler.update_database_entry(command)
        return DatabaseEntryDtoMapper.map_to_database_entry_dto(entry)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{database_id}/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_database_entry(database_id: str, entry_id: str):
    handler = DatabaseHandler()
    try:
        command = DatabaseEntryDeleteCommand(entry_id=entry_id, database_id=database_id)
        handler.delete_database_entry(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{database_id}/entries", response_model=List[DatabaseEntryDto])
async def list_database_entries(database_id: str):
    handler = DatabaseHandler()
    try:
        entries = handler.list_database_entries(database_id)
        return [DatabaseEntryDtoMapper.map_to_database_entry_dto(entry) for entry in entries]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 