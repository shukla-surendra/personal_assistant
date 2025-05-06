from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from uuid import UUID


class SettingsCommand(BaseModel):
    user_id: str
    workspace_id: str
    # Structured settings
    email_notifications: bool = True
    task_reminders: bool = True
    weekly_digest: bool = True
    language: str = "en"
    timezone: str = "UTC"
    theme: str = "light"
    # Flexible settings
    preferences: Dict = {}
    notification_settings: Dict = {}


class SettingsUpdateCommand(BaseModel):
    settings_id: str
    user_id: str
    workspace_id: str
    # Structured settings
    email_notifications: Optional[bool] = None
    task_reminders: Optional[bool] = None
    weekly_digest: Optional[bool] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    theme: Optional[str] = None
    # Flexible settings
    preferences: Optional[Dict] = None
    notification_settings: Optional[Dict] = None


class SettingsDeleteCommand(BaseModel):
    settings_id: str
    user_id: str
    workspace_id: str


class SettingsPreferencesCommand(BaseModel):
    settings_id: str
    user_id: str
    workspace_id: str
    preferences: Dict


class SettingsNotificationCommand(BaseModel):
    settings_id: str
    user_id: str
    workspace_id: str
    notification_settings: Dict 