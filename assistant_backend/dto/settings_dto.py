from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from uuid import UUID


class SettingsDto(BaseModel):
    settings_id: str
    user_id: str
    workspace_id: str
    # Structured settings
    email_notifications: bool
    task_reminders: bool
    weekly_digest: bool
    language: str
    timezone: str
    theme: str
    # Flexible settings
    preferences: Dict
    notification_settings: Dict
    created_at: datetime
    updated_at: datetime


class SettingsDtoMapper:
    @staticmethod
    def map_to_settings_dto(settings) -> SettingsDto:
        return SettingsDto(
            settings_id=str(settings.settings_id),
            user_id=str(settings.user_id),
            workspace_id=str(settings.workspace_id),
            # Structured settings
            email_notifications=settings.email_notifications,
            task_reminders=settings.task_reminders,
            weekly_digest=settings.weekly_digest,
            language=settings.language,
            timezone=settings.timezone,
            theme=settings.theme,
            # Flexible settings
            preferences=settings.preferences or {},
            notification_settings=settings.notification_settings or {},
            created_at=settings.created_at,
            updated_at=settings.updated_at
        ) 