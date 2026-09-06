from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class ActivityDto(BaseModel):
    activity_id: str
    workspace_id: str
    user_id: str
    action: str
    entity_id: str
    entity_type: str
    details: Optional[Dict[str, Any]] = None
    properties: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    user: Optional[Dict[str, Any]] = None

class ActivityDtoMapper:
    @staticmethod
    def map_to_activity_dto(activity) -> ActivityDto:
        return ActivityDto(
            activity_id=str(activity.activity_id),
            workspace_id=str(activity.workspace_id),
            user_id=str(activity.user_id),
            action=activity.action,
            entity_id=str(activity.entity_id),
            entity_type=activity.entity_type,
            details=activity.details,
            properties=activity.properties,
            created_at=activity.created_at.isoformat() if activity.created_at else None,
            user={
                'user_id': str(activity.user.user_id),
                'first_name': activity.user.first_name,
                'last_name': activity.user.last_name,
            } if activity.user else None,
        ) 