from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from authorization.auth import get_auth_details
from handlers.database_handler import DatabaseHandler
from handlers.workspace_handlers import WorkspaceHandler
from commands.database_cmd import DatabaseCommand, DatabaseUpdateCommand, DatabaseDeleteCommand, DatabaseEntryCommand, DatabaseEntryUpdateCommand, DatabaseEntryDeleteCommand
from dto.database_dto import DatabaseDto, DatabaseEntryDto
from dto.database_dto import DatabaseDtoMapper, DatabaseEntryDtoMapper
from config import logger

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/databases", tags=["databases"])


def _verify_workspace_access(workspace_id: str, user_id: str):
    """Same gate board_controller.py/page_controller.py use."""
    WorkspaceHandler().get_workspace(workspace_id, user_id)


@router.post("/", response_model=DatabaseDto, status_code=status.HTTP_201_CREATED)
async def create_database(workspace_id: str, command: DatabaseCommand, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    command.workspace_id = workspace_id
    try:
        database = DatabaseHandler().create_database(command)
        return DatabaseDtoMapper.map_to_database_dto(database)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{database_id}", response_model=DatabaseDto)
async def update_database(workspace_id: str, database_id: str, command: DatabaseUpdateCommand, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    command.database_id = database_id
    try:
        database = DatabaseHandler().update_database(command)
        return DatabaseDtoMapper.map_to_database_dto(database)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating database: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{database_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_database(workspace_id: str, database_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        command = DatabaseDeleteCommand(database_id=database_id, workspace_id=workspace_id)
        DatabaseHandler().delete_database(command)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting database: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{database_id}", response_model=DatabaseDto)
async def get_database(workspace_id: str, database_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        database = DatabaseHandler().get_database(database_id)
        if str(database.workspace_id) != str(workspace_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found")
        return DatabaseDtoMapper.map_to_database_dto(database)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting database: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[DatabaseDto])
async def list_databases(workspace_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        databases = DatabaseHandler().list_databases(workspace_id)
        return [DatabaseDtoMapper.map_to_database_dto(database) for database in databases]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing databases: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Database Entry endpoints
@router.post("/{database_id}/entries", response_model=DatabaseEntryDto, status_code=status.HTTP_201_CREATED)
async def create_database_entry(workspace_id: str, database_id: str, command: DatabaseEntryCommand, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    command.database_id = database_id
    try:
        entry = DatabaseHandler().create_database_entry(command)
        return DatabaseEntryDtoMapper.map_to_database_entry_dto(entry)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating database entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{database_id}/entries/{entry_id}", response_model=DatabaseEntryDto)
async def update_database_entry(workspace_id: str, database_id: str, entry_id: str, command: DatabaseEntryUpdateCommand, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    command.entry_id = entry_id
    try:
        entry = DatabaseHandler().update_database_entry(command)
        return DatabaseEntryDtoMapper.map_to_database_entry_dto(entry)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating database entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{database_id}/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_database_entry(workspace_id: str, database_id: str, entry_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        command = DatabaseEntryDeleteCommand(entry_id=entry_id, database_id=database_id)
        DatabaseHandler().delete_database_entry(command)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting database entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{database_id}/entries", response_model=List[DatabaseEntryDto])
async def list_database_entries(workspace_id: str, database_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        entries = DatabaseHandler().list_database_entries(database_id)
        return [DatabaseEntryDtoMapper.map_to_database_entry_dto(entry) for entry in entries]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing database entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


database_router = router
