from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from handlers.notification_handler import NotificationHandler
from commands.notification_cmd import NotificationCommand, NotificationUpdateCommand, NotificationDeleteCommand
from adapters.orm.models.pg_models import Notification
from dto.notification_dto import NotificationDto
from dto.notification_dto import NotificationDtoMapper

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/", response_model=NotificationDto, status_code=status.HTTP_201_CREATED)
async def create_notification(command: NotificationCommand):
    handler = NotificationHandler()
    try:
        notification = handler.create_notification(command)
        return NotificationDtoMapper.map_to_notification_dto(notification)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{notification_id}", response_model=NotificationDto)
async def update_notification(notification_id: str, command: NotificationUpdateCommand):
    handler = NotificationHandler()
    try:
        command.notification_id = notification_id
        notification = handler.update_notification(command)
        return NotificationDtoMapper.map_to_notification_dto(notification)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(notification_id: str, workspace_id: str):
    handler = NotificationHandler()
    try:
        command = NotificationDeleteCommand(notification_id=notification_id, workspace_id=workspace_id)
        handler.delete_notification(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{notification_id}", response_model=NotificationDto)
async def get_notification(notification_id: str):
    handler = NotificationHandler()
    try:
        notification = handler.get_notification(notification_id)
        return NotificationDtoMapper.map_to_notification_dto(notification)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[NotificationDto])
async def list_notifications(workspace_id: str, entity_id: Optional[str] = None, entity_type: Optional[str] = None):
    handler = NotificationHandler()
    try:
        notifications = handler.list_notifications(workspace_id, entity_id, entity_type)
        return [NotificationDtoMapper.map_to_notification_dto(notification) for notification in notifications]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 