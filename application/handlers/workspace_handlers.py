from datetime import datetime
from starlette import status
from fastapi import HTTPException
from application.commands.workspace_cmd import WorkspaceCreateCommand
from application.dto.workspace_dto import WorkspaceDtoMapper
from models import Workspace
from config import logger
from sqlalchemy.orm import Session
from database import get_db


class WorkspaceHandler:
    def __init__(self):
        self.db = next(get_db())

    def create_workspace(self, workspace: WorkspaceCreateCommand):
        """ Create a new workspace in PostgreSQL """
        try:
            owner = workspace.user.get("user_id")
            new_workspace = Workspace(
                name=workspace.workspace_name,
                description=workspace.description,
                owner_id=owner,
                is_default=workspace.is_default,
                settings={}
            )
            self.db.add(new_workspace)
            self.db.commit()
            self.db.refresh(new_workspace)
            return WorkspaceDtoMapper.map_to_workspace_dto_mapper(new_workspace)
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating workspace: {e}")
            raise HTTPException(status_code=500, detail="Failed to create workspace")

    def update_workspace(self, workspace_id: str, user_id: str, name: str = None, 
                        description: str = None, settings: dict = None):
        """ Update an existing workspace """
        try:
            workspace = self.db.query(Workspace).filter(
                Workspace.workspace_id == workspace_id,
                Workspace.is_deleted == False
            ).first()
            
            if not workspace:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

            if workspace.owner_id != user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
                                 detail="Not authorized to update this workspace")

            if name:
                workspace.name = name
            if description:
                workspace.description = description
            if settings:
                workspace.settings = settings

            workspace.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(workspace)
            return WorkspaceDtoMapper.map_to_workspace_dto_mapper(workspace)

        except HTTPException as he:
            self.db.rollback()
            raise he
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating workspace: {e}")
            raise HTTPException(status_code=500, detail="Failed to update workspace")

    def list_workspaces(self, user_id: str):
        """ List workspaces owned by user """
        try:
            logger.info(f"Listing workspaces for user_id: {user_id}")
            workspaces = self.db.query(Workspace).filter(
                Workspace.owner_id == user_id,
                Workspace.is_deleted == False
            ).all()
            
            logger.info(f"Found {len(workspaces)} workspaces")
            mapped_workspaces = []
            for workspace in workspaces:
                try:
                    logger.info(f"Mapping workspace: {workspace}")
                    mapped_workspace = WorkspaceDtoMapper.map_to_workspace_dto_mapper(workspace)
                    mapped_workspaces.append(mapped_workspace)
                except Exception as e:
                    logger.error(f"Error mapping workspace {workspace}: {str(e)}")
                    raise
            
            logger.info(f"Successfully mapped {len(mapped_workspaces)} workspaces")
            return mapped_workspaces
        except Exception as e:
            logger.error(f"Error listing workspaces: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to list workspaces: {str(e)}")

    def find_workspaces_by_member(self, user_id: str):
        """ Find workspaces where user is a member """
        try:
            logger.info(f"Finding workspaces for member user_id: {user_id}")
            workspaces = self.db.query(Workspace).filter(
                Workspace.users.contains([user_id]),
                Workspace.is_deleted == False
            ).all()
            
            logger.info(f"Found {len(workspaces)} workspaces for member")
            mapped_workspaces = []
            for workspace in workspaces:
                try:
                    logger.info(f"Mapping workspace: {workspace}")
                    mapped_workspace = WorkspaceDtoMapper.map_to_workspace_dto_mapper(workspace)
                    mapped_workspaces.append(mapped_workspace)
                except Exception as e:
                    logger.error(f"Error mapping workspace {workspace}: {str(e)}")
                    raise
            
            logger.info(f"Successfully mapped {len(mapped_workspaces)} workspaces for member")
            return mapped_workspaces
        except Exception as e:
            logger.error(f"Error finding workspaces by member: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to find workspaces: {str(e)}")

    def get_workspace(self, workspace_id: str, user_id: str):
        """ Get a single workspace """
        try:
            workspace = self.db.query(Workspace).filter(
                Workspace.workspace_id == workspace_id,
                Workspace.is_deleted == False
            ).first()
            
            if not workspace:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
                                 detail="Workspace not found")

            if workspace.owner_id != user_id and user_id not in workspace.users:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
                                 detail="Not authorized to access this workspace")

            return WorkspaceDtoMapper.map_to_workspace_dto_mapper(workspace)
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error getting workspace: {e}")
            raise HTTPException(status_code=500, detail="Failed to get workspace")

    def add_user_to_workspace(self, workspace_id: str, owner_id: str, user_id: str):
        """ Add a user to a workspace """
        try:
            workspace = self.db.query(Workspace).filter(
                Workspace.workspace_id == workspace_id,
                Workspace.is_deleted == False
            ).first()
            
            if not workspace:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
                                 detail="Workspace not found")

            if workspace.owner_id != owner_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
                                 detail="Not authorized to modify this workspace")

            if user_id not in workspace.users:
                workspace.users.append(user_id)
                workspace.updated_at = datetime.utcnow()
                self.db.commit()
                self.db.refresh(workspace)

            return WorkspaceDtoMapper.map_to_workspace_dto_mapper(workspace)
        except HTTPException as he:
            self.db.rollback()
            raise he
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding user to workspace: {e}")
            raise HTTPException(status_code=500, detail="Failed to add user to workspace")

    def remove_user_from_workspace(self, workspace_id: str, owner_id: str, user_id: str):
        """ Remove a user from a workspace """
        try:
            workspace = self.db.query(Workspace).filter(
                Workspace.workspace_id == workspace_id,
                Workspace.is_deleted == False
            ).first()
            
            if not workspace:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
                                 detail="Workspace not found")

            if workspace.owner_id != owner_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
                                 detail="Not authorized to modify this workspace")

            if user_id in workspace.users:
                workspace.users.remove(user_id)
                workspace.updated_at = datetime.utcnow()
                self.db.commit()
                self.db.refresh(workspace)

            return WorkspaceDtoMapper.map_to_workspace_dto_mapper(workspace)
        except HTTPException as he:
            self.db.rollback()
            raise he
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing user from workspace: {e}")
            raise HTTPException(status_code=500, detail="Failed to remove user from workspace")

    def get_default_workspace(self, user_id: str):
        """Get the default workspace for a user"""
        logger.info(f"######################## Getting default workspace for user_id: {user_id}")
        try:
            workspace = self.db.query(Workspace).filter(
                Workspace.owner_id == user_id,
                Workspace.is_default == True,
                Workspace.is_deleted == False
            ).first()
            
            logger.info(f"Default workspace: {workspace}")
            if not workspace:
                # If no default workspace is set, get the first workspace
                workspace = self.db.query(Workspace).filter(
                    Workspace.owner_id == user_id,
                    Workspace.is_deleted == False
                ).first()
                
                if workspace:
                    # Set it as default
                    workspace.is_default = True
                    self.db.commit()
                    self.db.refresh(workspace)
            
            return WorkspaceDtoMapper.map_to_workspace_dto_mapper(workspace) if workspace else None
        except Exception as e:
            logger.error(f"Error getting default workspace: {e}")
            raise HTTPException(status_code=500, detail="Failed to get default workspace")

    def set_default_workspace(self, workspace_id: str, user_id: str):
        """Set a workspace as default for a user"""
        try:
            # First, unset any existing default workspace
            self.db.query(Workspace).filter(
                Workspace.owner_id == user_id,
                Workspace.is_default == True
            ).update({"is_default": False})
            
            # Then set the new default workspace
            workspace = self.db.query(Workspace).filter(
                Workspace.workspace_id == workspace_id,
                Workspace.owner_id == user_id,
                Workspace.is_deleted == False
            ).first()
            
            if not workspace:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
                                 detail="Workspace not found")
            
            workspace.is_default = True
            self.db.commit()
            self.db.refresh(workspace)
            
            return WorkspaceDtoMapper.map_to_workspace_dto_mapper(workspace)
        except HTTPException as he:
            self.db.rollback()
            raise he
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error setting default workspace: {e}")
            raise HTTPException(status_code=500, detail="Failed to set default workspace")