from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict
from uuid import UUID
from handlers.settings_handler import SettingsHandler
from commands.settings_cmd import (
    SettingsCommand,
    SettingsUpdateCommand,
    SettingsDeleteCommand,
    SettingsPreferencesCommand,
    SettingsNotificationCommand
)
from dto.settings_dto import SettingsDto, SettingsDtoMapper
from authorization.auth import get_auth_details
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/workspaces/{workspace_id}/settings",
    tags=["settings"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
        status.HTTP_403_FORBIDDEN: {"description": "Operation not permitted"},
        status.HTTP_400_BAD_REQUEST: {"description": "Bad request"}
    },
)

@router.post("/", response_model=SettingsDto, status_code=status.HTTP_201_CREATED)
async def create_settings(workspace_id: str, command: SettingsCommand, user: dict = Depends(get_auth_details)):
    """Create new user settings"""
    handler = SettingsHandler()
    try:
        assert command.user_id == user.get("user_id")
        settings = handler.create_settings(command)
        return SettingsDtoMapper.map_to_settings_dto(settings)
    except Exception as e:
        logger.error(f"Error creating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=SettingsDto)
async def get_settings(workspace_id: str, user: dict = Depends(get_auth_details)):
    """Get user settings for a workspace"""
    handler = SettingsHandler()
    try:
        settings = handler.get_settings(user.get("user_id"), workspace_id)
        if not settings:
            raise HTTPException(status_code=404, detail="Settings not found")
        return SettingsDtoMapper.map_to_settings_dto(settings)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{settings_id}", response_model=SettingsDto)
async def update_settings(workspace_id: str, settings_id: str, command: SettingsUpdateCommand, user: dict = Depends(get_auth_details)):
    """Update user settings"""
    handler = SettingsHandler()
    try:
        assert command.user_id == user.get("user_id")
        command.settings_id = settings_id
        settings = handler.update_settings(command)
        return SettingsDtoMapper.map_to_settings_dto(settings)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{settings_id}/preferences", response_model=SettingsDto)
async def update_preferences(
    workspace_id: str,
    settings_id: str,
    preferences: Dict,
    user: dict = Depends(get_auth_details)
):
    """Update user preferences"""
    handler = SettingsHandler()
    try:
        command = SettingsPreferencesCommand(
            settings_id=settings_id,
            user_id=user.get("user_id"),
            workspace_id=workspace_id,
            preferences=preferences
        )
        settings = handler.update_preferences(command)
        return SettingsDtoMapper.map_to_settings_dto(settings)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{settings_id}/notifications", response_model=SettingsDto)
async def update_notification_settings(
    workspace_id: str,
    settings_id: str,
    notification_settings: Dict,
    user: dict = Depends(get_auth_details)
):
    """Update notification settings"""
    handler = SettingsHandler()
    try:
        command = SettingsNotificationCommand(
            settings_id=settings_id,
            user_id=user.get("user_id"),
            workspace_id=workspace_id,
            notification_settings=notification_settings
        )
        settings = handler.update_notification_settings(command)
        return SettingsDtoMapper.map_to_settings_dto(settings)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating notification settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{settings_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_settings(workspace_id: str, settings_id: str, user: dict = Depends(get_auth_details)):
    """Delete user settings"""
    handler = SettingsHandler()
    try:
        command = SettingsDeleteCommand(
            settings_id=settings_id,
            user_id=user.get("user_id"),
            workspace_id=workspace_id
        )
        handler.delete_settings(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 