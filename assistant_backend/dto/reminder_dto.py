from pydantic import BaseModel
from typing import Optional, Dict, Any

class ReminderDto(BaseModel):
    reminder_id: str
    workspace_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    due_date: str
    repeat: Optional[str] = None
    is_completed: bool
    properties: Optional[Dict[str, Any]] = None

class ReminderDtoMapper:
    @staticmethod
    def map_to_reminder_dto(reminder) -> ReminderDto:
        return ReminderDto(
            reminder_id=str(reminder.reminder_id),
            workspace_id=str(reminder.workspace_id),
            user_id=str(reminder.user_id),
            title=reminder.title,
            description=reminder.description,
            due_date=reminder.due_date.isoformat(),
            repeat=reminder.repeat,
            is_completed=reminder.is_completed,
            properties=reminder.properties
        )
