from typing import Optional, Dict, List
from pydantic import BaseModel
import logging
from datetime import datetime
import uuid
from adapters.orm.models.pg_models import Workspace

logger = logging.getLogger(__name__)


class WorkspaceDto(BaseModel):
    """ Workspace Dto """
    workspace_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    owner_id: str
    users: List[str] = []
    settings: Dict = {}
    is_deleted: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class WorkspaceDtoMapper:
    @staticmethod
    def to_dto(workspace: Workspace) -> WorkspaceDto:
        return WorkspaceDto(
            workspace_id=str(workspace.workspace_id),
            name=workspace.name,
            description=workspace.description,
            owner_id=str(workspace.owner_id),
            settings=workspace.settings,
            meta_data=workspace.meta_data,
            system_default=workspace.system_default,
            is_default=workspace.is_default,
            is_deleted=workspace.is_deleted,
            created_at=workspace.created_at,
            updated_at=workspace.updated_at,
            users=[str(user.user_id) for user in workspace.users] if workspace.users else []
        )

    @staticmethod
    def to_entity(dto: WorkspaceDto) -> Workspace:
        return Workspace(
            workspace_id=uuid.UUID(dto.workspace_id) if dto.workspace_id else uuid.uuid4(),
            name=dto.name,
            description=dto.description,
            owner_id=uuid.UUID(dto.owner_id),
            settings=dto.settings,
            meta_data=dto.meta_data,
            system_default=dto.system_default,
            is_default=dto.is_default,
            is_deleted=dto.is_deleted,
            created_at=dto.created_at,
            updated_at=dto.updated_at
        )

    @staticmethod
    def map_to_workspace_dto_mapper(workspace_object):
        try:
            logger.info(f"Mapping workspace object: {workspace_object}")
            # Handle dictionary input
            if isinstance(workspace_object, dict):
                logger.info("Processing dictionary input")
                mapped = WorkspaceDto(
                    workspace_id=str(workspace_object.get('workspace_id')),
                    name=str(workspace_object.get('name')),
                    description=workspace_object.get('description'),
                    owner_id=str(workspace_object.get('owner_id')),
                    users=workspace_object.get('users', []),
                    settings=workspace_object.get('settings', {}),
                    is_deleted=workspace_object.get('is_deleted', False),
                    created_at=WorkspaceDtoMapper.datetime_to_str(workspace_object.get('created_at')),
                    updated_at=WorkspaceDtoMapper.datetime_to_str(workspace_object.get('updated_at'))
                )
                logger.info(f"Mapped dictionary to DTO: {mapped}")
                return mapped
            
            # Handle object input
            logger.info("Processing object input")
            mapped = WorkspaceDto(
                workspace_id=str(workspace_object.workspace_id),
                name=str(workspace_object.name),
                description=workspace_object.description,
                owner_id=str(workspace_object.owner_id),
                users=workspace_object.users,
                settings=workspace_object.settings,
                is_deleted=workspace_object.is_deleted,
                created_at=WorkspaceDtoMapper.datetime_to_str(workspace_object.created_at),
                updated_at=WorkspaceDtoMapper.datetime_to_str(workspace_object.updated_at)
            )
            logger.info(f"Mapped object to DTO: {mapped}")
            return mapped
        except Exception as e:
            logger.error(f"Error in workspace mapping: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def datetime_to_str(datetime_obj):
        if isinstance(datetime_obj, datetime):
            return datetime_obj.isoformat()
        return None
