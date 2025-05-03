from typing import Optional
from uuid import UUID
from adapters.orm.models.pg_models import Notification
from adapters.orm.models.database import SessionLocal
from commands.notification_cmd import NotificationCommand, NotificationUpdateCommand, NotificationDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class NotificationHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_notification(self, command: NotificationCommand) -> Notification:
        try:
            notification = Notification(
                workspace_id=UUID(command.workspace_id),
                title=command.title,
                message=command.message,
                type=command.type,
                entity_id=UUID(command.entity_id) if command.entity_id else None,
                entity_type=command.entity_type,
                properties=command.properties
            )
            self.db.add(notification)
            self.db.commit()
            self.db.refresh(notification)
            return notification
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating notification: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create notification")

    def update_notification(self, command: NotificationUpdateCommand) -> Notification:
        try:
            notification = self.db.query(Notification).filter(Notification.notification_id == UUID(command.notification_id)).first()
            if not notification:
                raise HTTPException(status_code=404, detail="Notification not found")

            if command.title is not None:
                notification.title = command.title
            if command.message is not None:
                notification.message = command.message
            if command.type is not None:
                notification.type = command.type
            if command.properties is not None:
                notification.properties = command.properties

            self.db.commit()
            self.db.refresh(notification)
            return notification
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating notification: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update notification")

    def delete_notification(self, command: NotificationDeleteCommand) -> bool:
        try:
            notification = self.db.query(Notification).filter(
                Notification.notification_id == UUID(command.notification_id),
                Notification.workspace_id == UUID(command.workspace_id)
            ).first()
            if not notification:
                raise HTTPException(status_code=404, detail="Notification not found")

            self.db.delete(notification)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting notification: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete notification")

    def __del__(self):
        self.db.close() 