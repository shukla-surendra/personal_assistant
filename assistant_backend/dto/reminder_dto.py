from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class ReminderDto(BaseModel):
    reminder_id: str
    workspace_id: str
    entity_id: str
    entity_type: str
    user_id: str
    title: str
    description: Optional[str] = None
    due_date: str
    repeat: Optional[str] = None
    status: str
    properties: Optional[Dict[str, Any]] = None

class ReminderDtoMapper:
    @staticmethod
    def map_to_reminder_dto(reminder) -> ReminderDto:
        return ReminderDto(
            reminder_id=str(reminder.reminder_id),
            workspace_id=str(reminder.workspace_id),
            entity_id=str(reminder.entity_id),
            entity_type=reminder.entity_type,
            user_id=str(reminder.user_id),
            title=reminder.title,
            description=reminder.description,
            due_date=reminder.due_date.isoformat(),
            repeat=reminder.repeat,
            status=reminder.status,
            properties=reminder.properties
        ) 