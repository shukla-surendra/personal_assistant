from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import logging
from datetime import datetime
import uuid
from adapters.orm.models.pg_models import Workspace

logger = logging.getLogger(__name__)


class WorkspaceDto(BaseModel):
    """ Workspace Dto """
    workspace_id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    members: Optional[List[Dict[str, Any]]] = None
    settings: Optional[Dict[str, Any]] = None
    is_public: bool = False
    is_template: bool = False


class WorkspaceDtoMapper:
    @staticmethod
    def to_dto(workspace: Workspace) -> WorkspaceDto:
        return WorkspaceDto(
            workspace_id=str(workspace.workspace_id),
            name=workspace.name,
            description=workspace.description,
            owner_id=str(workspace.owner_id),
            icon=workspace.icon,
            cover=workspace.cover,
            properties=workspace.properties,
            members=workspace.members,
            settings=workspace.settings,
            is_public=workspace.is_public,
            is_template=workspace.is_template
        )

    @staticmethod
    def to_entity(dto: WorkspaceDto) -> Workspace:
        return Workspace(
            workspace_id=uuid.UUID(dto.workspace_id) if dto.workspace_id else uuid.uuid4(),
            name=dto.name,
            description=dto.description,
            owner_id=uuid.UUID(dto.owner_id),
            icon=dto.icon,
            cover=dto.cover,
            properties=dto.properties,
            members=dto.members,
            settings=dto.settings,
            is_public=dto.is_public,
            is_template=dto.is_template
        )

    @staticmethod
    def map_to_workspace_dto(workspace) -> WorkspaceDto:
        return WorkspaceDto(
            workspace_id=str(workspace.workspace_id),
            owner_id=str(workspace.owner_id),
            name=workspace.name,
            description=workspace.description,
            icon=workspace.icon,
            cover=workspace.cover,
            properties=workspace.properties,
            members=workspace.members,
            settings=workspace.settings,
            is_public=workspace.is_public,
            is_template=workspace.is_template
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
                    icon=workspace_object.get('icon'),
                    cover=workspace_object.get('cover'),
                    properties=workspace_object.get('properties'),
                    members=workspace_object.get('members'),
                    settings=workspace_object.get('settings'),
                    is_public=workspace_object.get('is_public', False),
                    is_template=workspace_object.get('is_template', False)
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
                icon=workspace_object.icon,
                cover=workspace_object.cover,
                properties=workspace_object.properties,
                members=workspace_object.members,
                settings=workspace_object.settings,
                is_public=workspace_object.is_public,
                is_template=workspace_object.is_template
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
