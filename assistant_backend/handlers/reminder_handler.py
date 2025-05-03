from typing import Optional
from uuid import UUID
from adapters.orm.models.pg_models import Reminder
from adapters.orm.models.database import SessionLocal
from commands.reminder_cmd import ReminderCommand, ReminderUpdateCommand, ReminderDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class ReminderHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_reminder(self, command: ReminderCommand) -> Reminder:
        try:
            reminder = Reminder(
                workspace_id=UUID(command.workspace_id),
                title=command.title,
                description=command.description,
                due_date=command.due_date,
                entity_id=UUID(command.entity_id),
                entity_type=command.entity_type,
                properties=command.properties
            )
            self.db.add(reminder)
            self.db.commit()
            self.db.refresh(reminder)
            return reminder
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating reminder: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create reminder")

    def update_reminder(self, command: ReminderUpdateCommand) -> Reminder:
        try:
            reminder = self.db.query(Reminder).filter(Reminder.reminder_id == UUID(command.reminder_id)).first()
            if not reminder:
                raise HTTPException(status_code=404, detail="Reminder not found")

            if command.title is not None:
                reminder.title = command.title
            if command.description is not None:
                reminder.description = command.description
            if command.due_date is not None:
                reminder.due_date = command.due_date
            if command.properties is not None:
                reminder.properties = command.properties

            self.db.commit()
            self.db.refresh(reminder)
            return reminder
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating reminder: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update reminder")

    def delete_reminder(self, command: ReminderDeleteCommand) -> bool:
        try:
            reminder = self.db.query(Reminder).filter(
                Reminder.reminder_id == UUID(command.reminder_id),
                Reminder.workspace_id == UUID(command.workspace_id)
            ).first()
            if not reminder:
                raise HTTPException(status_code=404, detail="Reminder not found")

            self.db.delete(reminder)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting reminder: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete reminder")

    def __del__(self):
        self.db.close() 