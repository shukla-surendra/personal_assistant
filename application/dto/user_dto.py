""""""
from typing import List, Optional, Dict
from pydantic import BaseModel


class UserDto(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    email: str
    tasks: Optional[List] = None
    role: str
    status: str
    default_workspace_id: Optional[str] = None
    default_workspace_name: Optional[str] = None


class UserDtoMapper:

    @staticmethod
    def map_to_user_dto_mapper(user_object):
        # Handle dictionary input
        if isinstance(user_object, dict):
            return UserDto(
                user_id=str(user_object.get('user_id')),
                first_name=str(user_object.get('first_name')),
                last_name=str(user_object.get('last_name')),
                email=str(user_object.get('email')),
                role=str(user_object.get('role')),
                tasks=user_object.get('tasks', []),
                status=str(user_object.get('status')),
                default_workspace_id=str(user_object.get('default_workspace', {}).get('workspace_id')) if user_object.get('default_workspace') else None,
                default_workspace_name=user_object.get('default_workspace', {}).get('workspace_name') if user_object.get('default_workspace') else None
            )
        # Handle object input
        return UserDto(
            user_id=str(user_object.user_id),
            first_name=str(user_object.first_name),
            last_name=str(user_object.last_name),
            email=str(user_object.email),
            role=str(user_object.role.value),
            tasks=list(user_object.tasks),
            status=str(user_object.status.value),
            default_workspace_id=str(user_object.default_workspace.get("workspace_id")) if hasattr(user_object, 'default_workspace') else None,
            default_workspace_name=user_object.default_workspace.get("workspace_name") if hasattr(user_object, 'default_workspace') else None
        )
