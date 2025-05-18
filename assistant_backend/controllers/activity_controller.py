from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from handlers.activity_handler import ActivityHandler
from commands.activity_cmd import ActivityCommand, ActivityUpdateCommand, ActivityDeleteCommand
from adapters.orm.models.pg_models import Activity
from dto.activity_dto import ActivityDto
from dto.activity_dto import ActivityDtoMapper

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/activities", tags=["activities"])

@router.post("/", response_model=ActivityDto, status_code=status.HTTP_201_CREATED)
async def create_activity(command: ActivityCommand):
    handler = ActivityHandler()
    try:
        activity = handler.create_activity(command)
        return ActivityDtoMapper.map_to_activity_dto(activity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{activity_id}", response_model=ActivityDto)
async def update_activity(activity_id: str, command: ActivityUpdateCommand):
    handler = ActivityHandler()
    try:
        command.activity_id = activity_id
        activity = handler.update_activity(command)
        return ActivityDtoMapper.map_to_activity_dto(activity)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(activity_id: str, workspace_id: str):
    handler = ActivityHandler()
    try:
        command = ActivityDeleteCommand(activity_id=activity_id, workspace_id=workspace_id)
        handler.delete_activity(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{activity_id}", response_model=ActivityDto)
async def get_activity(activity_id: str):
    handler = ActivityHandler()
    try:
        activity = handler.get_activity(activity_id)
        return ActivityDtoMapper.map_to_activity_dto(activity)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ActivityDto])
async def list_activities(workspace_id: str, entity_id: Optional[str] = None, entity_type: Optional[str] = None):
    handler = ActivityHandler()
    try:
        activities = handler.list_activities(workspace_id, entity_id, entity_type)
        return [ActivityDtoMapper.map_to_activity_dto(activity) for activity in activities]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 