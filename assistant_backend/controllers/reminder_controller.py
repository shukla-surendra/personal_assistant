from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from handlers.reminder_handler import ReminderHandler
from commands.reminder_cmd import ReminderCommand, ReminderUpdateCommand, ReminderDeleteCommand
from adapters.orm.models.pg_models import Reminder
from dto.reminder_dto import ReminderDto
from dto.reminder_dto import ReminderDtoMapper
from authorization.auth import get_auth_details

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/reminders", tags=["reminders"])

@router.post("/", response_model=ReminderDto, status_code=status.HTTP_201_CREATED)
async def create_reminder(command: ReminderCommand, workspace_id: str, user: dict = Depends(get_auth_details)):
    handler = ReminderHandler()
    command.workspace_id = workspace_id
    command.user_id = user.get("user_id")
    try:
        reminder = handler.create_reminder(command)
        return ReminderDtoMapper.map_to_reminder_dto(reminder)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{reminder_id}", response_model=ReminderDto)
async def update_reminder(reminder_id: str, command: ReminderUpdateCommand, workspace_id: str, user: dict = Depends(get_auth_details)):
    handler = ReminderHandler()
    command.reminder_id = reminder_id
    command.workspace_id = workspace_id
    command.user_id = user.get("user_id")
    try:
        reminder = handler.update_reminder(command)
        return ReminderDtoMapper.map_to_reminder_dto(reminder)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(reminder_id: str, workspace_id: str, user: dict = Depends(get_auth_details)):
    handler = ReminderHandler()
    try:
        command = ReminderDeleteCommand(reminder_id=reminder_id, workspace_id=workspace_id, user_id=user.get("user_id"))
        handler.delete_reminder(command)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{reminder_id}", response_model=ReminderDto)
async def get_reminder(reminder_id: str, workspace_id: str, user: dict = Depends(get_auth_details)):
    handler = ReminderHandler()
    try:
        reminder = handler.get_reminder(reminder_id, workspace_id, user.get("user_id"))
        return ReminderDtoMapper.map_to_reminder_dto(reminder)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ReminderDto])
async def list_reminders(workspace_id: str, user: dict = Depends(get_auth_details)):
    handler = ReminderHandler()
    try:
        reminders = handler.list_reminders(workspace_id, user.get("user_id"))
        return [ReminderDtoMapper.map_to_reminder_dto(r) for r in reminders]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

reminder_router = router 