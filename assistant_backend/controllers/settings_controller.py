from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any
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
from sqlalchemy.orm import Session
from database.connection import get_db
from models.settings import UserSettings
from models.user import User
from utils.auth import get_current_user

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

@router.get("/")
async def get_settings_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get user settings."""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return {
        "assistant_settings": settings.assistant_settings,
        "theme_settings": settings.theme_settings,
        "privacy_settings": settings.privacy_settings,
        "workspace_settings": settings.workspace_settings
    }

@router.put("/assistant")
async def update_assistant_settings(
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update assistant settings."""
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
    
    user_settings.assistant_settings.update(settings)
    db.commit()
    db.refresh(user_settings)
    
    return {"message": "Assistant settings updated", "settings": user_settings.assistant_settings}

@router.put("/theme")
async def update_theme_settings(
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update theme settings."""
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
    
    user_settings.theme_settings.update(settings)
    db.commit()
    db.refresh(user_settings)
    
    return {"message": "Theme settings updated", "settings": user_settings.theme_settings}

@router.put("/privacy")
async def update_privacy_settings(
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update privacy settings."""
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
    
    user_settings.privacy_settings.update(settings)
    db.commit()
    db.refresh(user_settings)
    
    return {"message": "Privacy settings updated", "settings": user_settings.privacy_settings}

@router.put("/workspace")
async def update_workspace_settings(
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update workspace settings."""
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
    
    user_settings.workspace_settings.update(settings)
    db.commit()
    db.refresh(user_settings)
    
    return {"message": "Workspace settings updated", "settings": user_settings.workspace_settings}

settings_router = router 