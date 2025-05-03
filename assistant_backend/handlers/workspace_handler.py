from typing import Optional, List
from uuid import UUID
from adapters.orm.models.pg_models import Workspace
from adapters.orm.models.database import SessionLocal
from commands.workspace_cmd import WorkspaceCommand, WorkspaceUpdateCommand, WorkspaceDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class WorkspaceHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_workspace(self, command: WorkspaceCommand) -> Workspace:
        try:
            workspace = Workspace(
                name=command.name,
                description=command.description,
                owner_id=UUID(command.owner_id),
                members=[UUID(member_id) for member_id in command.members],
                settings=command.settings,
                properties=command.properties
            )
            self.db.add(workspace)
            self.db.commit()
            self.db.refresh(workspace)
            return workspace
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating workspace: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create workspace")

    def update_workspace(self, command: WorkspaceUpdateCommand) -> Workspace:
        try:
            workspace = self.db.query(Workspace).filter(Workspace.workspace_id == UUID(command.workspace_id)).first()
            if not workspace:
                raise HTTPException(status_code=404, detail="Workspace not found")

            if command.name is not None:
                workspace.name = command.name
            if command.description is not None:
                workspace.description = command.description
            if command.members is not None:
                workspace.members = [UUID(member_id) for member_id in command.members]
            if command.settings is not None:
                workspace.settings = command.settings
            if command.properties is not None:
                workspace.properties = command.properties

            self.db.commit()
            self.db.refresh(workspace)
            return workspace
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating workspace: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update workspace")

    def delete_workspace(self, command: WorkspaceDeleteCommand) -> bool:
        try:
            workspace = self.db.query(Workspace).filter(
                Workspace.workspace_id == UUID(command.workspace_id),
                Workspace.owner_id == UUID(command.owner_id)
            ).first()
            if not workspace:
                raise HTTPException(status_code=404, detail="Workspace not found")

            self.db.delete(workspace)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting workspace: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete workspace")

    def __del__(self):
        self.db.close() 