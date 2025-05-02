from typing import Optional, Dict
from pydantic import BaseModel
from datetime import datetime


class UserSettingsDto(BaseModel):
    user_id: str
    preferences: Dict = {}
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    notification_settings: Dict = {}
    updated_at: datetime


class UserSettingsUpdateDto(BaseModel):
    preferences: Optional[Dict] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    notification_settings: Optional[Dict] = None 