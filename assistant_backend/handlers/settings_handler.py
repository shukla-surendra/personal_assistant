from typing import Optional, Dict
from uuid import UUID
from adapters.orm.models.pg_models import UserSettings
from adapters.orm.models.database import SessionLocal
from commands.settings_cmd import (
    SettingsCommand,
    SettingsUpdateCommand,
    SettingsDeleteCommand,
    SettingsPreferencesCommand,
    SettingsNotificationCommand
)
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class SettingsHandler:
    def __init__(self):
        self.db = SessionLocal()

    def _get_default_settings(self, user_id: UUID, workspace_id: UUID) -> UserSettings:
        """Create default settings for a user in a workspace"""
        return UserSettings(
            user_id=user_id,
            workspace_id=workspace_id,
            email_notifications=True,
            task_reminders=True,
            weekly_digest=True,
            language="en",
            timezone="UTC",
            theme="light",
            preferences={},
            notification_settings={}
        )

    def get_settings(self, user_id: str, workspace_id: str) -> UserSettings:
        try:
            settings = self.db.query(UserSettings).filter(
                UserSettings.user_id == UUID(user_id),
                UserSettings.workspace_id == UUID(workspace_id)
            ).first()
            
            if not settings:
                # Create default settings if none exist
                settings = self._get_default_settings(UUID(user_id), UUID(workspace_id))
                self.db.add(settings)
                self.db.commit()
                self.db.refresh(settings)
            
            return settings
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error getting settings: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to get settings")

    def update_settings(self, command: SettingsUpdateCommand) -> UserSettings:
        try:
            settings = self.db.query(UserSettings).filter(
                UserSettings.settings_id == UUID(command.settings_id) if command.settings_id else False,
                UserSettings.user_id == UUID(command.user_id),
                UserSettings.workspace_id == UUID(command.workspace_id)
            ).first()
            
            if not settings:
                # Create new settings if they don't exist
                settings = self._get_default_settings(UUID(command.user_id), UUID(command.workspace_id))
                self.db.add(settings)

            # Update structured settings
            if command.email_notifications is not None:
                settings.email_notifications = command.email_notifications
            if command.task_reminders is not None:
                settings.task_reminders = command.task_reminders
            if command.weekly_digest is not None:
                settings.weekly_digest = command.weekly_digest
            if command.language is not None:
                settings.language = command.language
            if command.timezone is not None:
                settings.timezone = command.timezone
            if command.theme is not None:
                settings.theme = command.theme

            # Update flexible settings
            if command.preferences is not None:
                settings.preferences = command.preferences
            if command.notification_settings is not None:
                settings.notification_settings = command.notification_settings

            self.db.commit()
            self.db.refresh(settings)
            return settings
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating settings: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update settings")

    def update_preferences(self, command: SettingsPreferencesCommand) -> UserSettings:
        try:
            settings = self.db.query(UserSettings).filter(
                UserSettings.settings_id == UUID(command.settings_id) if command.settings_id else False,
                UserSettings.user_id == UUID(command.user_id),
                UserSettings.workspace_id == UUID(command.workspace_id)
            ).first()
            
            if not settings:
                # Create new settings if they don't exist
                settings = self._get_default_settings(UUID(command.user_id), UUID(command.workspace_id))
                self.db.add(settings)

            settings.preferences = command.preferences
            self.db.commit()
            self.db.refresh(settings)
            return settings
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating preferences: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update preferences")

    def update_notification_settings(self, command: SettingsNotificationCommand) -> UserSettings:
        try:
            settings = self.db.query(UserSettings).filter(
                UserSettings.settings_id == UUID(command.settings_id) if command.settings_id else False,
                UserSettings.user_id == UUID(command.user_id),
                UserSettings.workspace_id == UUID(command.workspace_id)
            ).first()
            
            if not settings:
                # Create new settings if they don't exist
                settings = self._get_default_settings(UUID(command.user_id), UUID(command.workspace_id))
                self.db.add(settings)

            settings.notification_settings = command.notification_settings
            self.db.commit()
            self.db.refresh(settings)
            return settings
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating notification settings: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update notification settings")

    def delete_settings(self, command: SettingsDeleteCommand) -> bool:
        try:
            settings = self.db.query(UserSettings).filter(
                UserSettings.settings_id == UUID(command.settings_id),
                UserSettings.user_id == UUID(command.user_id),
                UserSettings.workspace_id == UUID(command.workspace_id)
            ).first()
            
            if not settings:
                raise HTTPException(status_code=404, detail="Settings not found")

            self.db.delete(settings)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting settings: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete settings")

    def __del__(self):
        self.db.close() 