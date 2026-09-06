from uuid import UUID
from adapters.orm.models.pg_models import Epic
from adapters.orm.models.database import SessionLocal
from commands.epic_cmd import EpicCommand, EpicUpdateCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


class EpicHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_epic(self, command: EpicCommand) -> Epic:
        try:
            epic = Epic(
                workspace_id=UUID(command.workspace_id),
                board_id=UUID(command.board_id),
                title=command.title,
                description=command.description,
                color=command.color or "#6554C0",
                start_date=command.start_date,
                due_date=command.due_date,
            )
            self.db.add(epic)
            self.db.commit()
            self.db.refresh(epic)
            return epic
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating epic: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create epic")

    def get_epic(self, epic_id: str) -> Epic:
        try:
            epic = self.db.query(Epic).filter(
                Epic.epic_id == UUID(epic_id),
                Epic.is_deleted == False
            ).first()
            if not epic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Epic not found")
            return epic
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            logger.error(f"Error getting epic: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to get epic")

    def list_epics(self, board_id: str) -> list[Epic]:
        try:
            return self.db.query(Epic).filter(
                Epic.board_id == UUID(board_id),
                Epic.is_deleted == False
            ).order_by(Epic.created_at.asc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing epics: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list epics")

    def update_epic(self, command: EpicUpdateCommand) -> Epic:
        try:
            epic = self.get_epic(command.epic_id)
            if command.title is not None:
                epic.title = command.title
            if command.description is not None:
                epic.description = command.description
            if command.color is not None:
                epic.color = command.color
            if command.status is not None:
                epic.status = command.status
            if command.start_date is not None:
                epic.start_date = command.start_date
            if command.due_date is not None:
                epic.due_date = command.due_date

            self.db.commit()
            self.db.refresh(epic)
            return epic
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating epic: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update epic")

    def delete_epic(self, epic_id: str, board_id: str):
        try:
            epic = self.db.query(Epic).filter(
                Epic.epic_id == UUID(epic_id),
                Epic.board_id == UUID(board_id),
                Epic.is_deleted == False
            ).first()
            if not epic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Epic not found")

            epic.is_deleted = True
            # Unassign it from any tasks currently tagged with it rather
            # than leaving a dangling reference to a "deleted" epic.
            from adapters.orm.models.pg_models import Task
            self.db.query(Task).filter(Task.epic_id == epic.epic_id).update({"epic_id": None})
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting epic: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete epic")

    def __del__(self):
        self.db.close()
