from uuid import UUID
from fastapi import APIRouter, Depends
from dto.user_settings_dto import UserSettingsDto, UserSettingsUpdateDto
from handlers.user_settings_handler import UserSettingsHandler
from authorization.auth import get_auth_details


router = APIRouter(prefix="/api/v1/user-settings", tags=["user-settings"])


@router.get("/", response_model=UserSettingsDto)
async def get_settings(
    current_user: dict = Depends(get_auth_details)
):
    return await UserSettingsHandler().get_settings(UUID(current_user["user_id"]))


@router.put("/", response_model=UserSettingsDto)
async def update_settings(
    settings: UserSettingsUpdateDto,
    current_user: dict = Depends(get_auth_details)
):
    return await UserSettingsHandler().update_settings(UUID(current_user["user_id"]), settings)


@router.put("/preferences", response_model=UserSettingsDto)
async def update_preferences(
    preferences: dict,
    current_user: dict = Depends(get_auth_details)
):
    return await UserSettingsHandler().update_preferences(UUID(current_user["user_id"]), preferences)


@router.put("/notifications", response_model=UserSettingsDto)
async def update_notification_settings(
    notification_settings: dict,
    current_user: dict = Depends(get_auth_details)
):
    return await UserSettingsHandler().update_notification_settings(UUID(current_user["user_id"]), notification_settings)