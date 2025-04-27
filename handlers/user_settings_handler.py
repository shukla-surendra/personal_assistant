from uuid import UUID
from fastapi import HTTPException, status
from dto.user_settings_dto import UserSettingsDto, UserSettingsUpdateDto
from adapters.factory import AdapterFactory, StorageType, AuthType
from config import logger, get_config

config = get_config()

class UserSettingsHandler:
    def __init__(self):
        self.factory = AdapterFactory()
        self.storage = self.factory.get_storage_adapter(StorageType(config.storage_type))
        self.auth = self.factory.get_auth_adapter(AuthType(config.auth_type))

    async def get_settings(self, user_id: UUID) -> UserSettingsDto:
        try:
            settings = await self.storage.get_settings(user_id)
            if not settings:
                # Create default settings if none exist
                settings = await self.storage.update_settings(user_id, {})
            return UserSettingsDto(
                user_id=str(settings.user_id),
                preferences=settings.preferences,
                theme=settings.theme,
                language=settings.language,
                timezone=settings.timezone,
                notification_settings=settings.notification_settings,
                updated_at=settings.updated_at
            )
        except Exception as e:
            logger.error(f"Error getting user settings: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get user settings"
            )

    async def update_settings(self, user_id: UUID, settings: UserSettingsUpdateDto) -> UserSettingsDto:
        try:
            # Convert Pydantic model to dict and remove None values
            settings_dict = {k: v for k, v in settings.dict().items() if v is not None}
            result =  await self.storage.update_settings(user_id, settings_dict)
            return UserSettingsDto(
                user_id=str(result.user_id),
                preferences=result.preferences,
                theme=result.theme,
                language=result.language,
                timezone=result.timezone,
                notification_settings=result.notification_settings,
                updated_at=result.updated_at
            )
        except Exception as e:
            logger.error(f"Error updating user settings: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user settings"
            )

    async def update_preferences(self, user_id: UUID, preferences: dict) -> UserSettingsDto:
        try:
            result =  await self.storage.update_preferences(user_id, preferences)
            return UserSettingsDto(
                user_id=str(result.user_id),
                preferences=result.preferences,
                theme=result.theme,
                language=result.language,
                timezone=result.timezone,
                notification_settings=result.notification_settings,
                updated_at=result.updated_at
            )

        except Exception as e:
            logger.error(f"Error updating user preferences: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user preferences"
            )

    async def update_notification_settings(self, user_id: UUID, notification_settings: dict) -> UserSettingsDto:
        try:
            result =  await self.storage.update_notification_settings(user_id, notification_settings)
            return UserSettingsDto(
                user_id=str(result.user_id),
                preferences=result.preferences,
                theme=result.theme,
                language=result.language,
                timezone=result.timezone,
                notification_settings=result.notification_settings,
                updated_at=result.updated_at
            )
        except Exception as e:
            logger.error(f"Error updating notification settings: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update notification settings"
            ) 