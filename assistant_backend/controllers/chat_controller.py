from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from handlers.chat_handler import ChatHandler
from commands.chat_cmd import (
    ChatCommand, ChatUpdateCommand, ChatDeleteCommand,
    ChatMessageCommand, ChatMessageUpdateCommand, ChatMessageDeleteCommand
)
from dto.chat_dto import ChatDto, ChatMessageDto
from dto.chat_dto import ChatDtoMapper, ChatMessageDtoMapper
from modules.access import require_module_enabled
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/chats", tags=["chats"])

# Already a live, always-on feature before the module registry existed --
# default_enabled=True so no existing workspace loses it silently.
gate = require_module_enabled("chat", default_enabled=True)

@router.post("/", response_model=ChatDto, status_code=status.HTTP_201_CREATED)
async def create_chat(
    workspace_id: str,
    command: ChatCommand,
    current_user: dict = Depends(gate)
):
    """Create a new chat"""
    handler = ChatHandler()
    try:
        command.workspace_id = workspace_id
        command.user_id = current_user.get("user_id")
        chat = handler.create_chat(command)
        return ChatDtoMapper.map_to_chat_dto(chat)
    except Exception as e:
        logger.error(f"Error creating chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to create chat")

@router.get("/", response_model=List[ChatDto])
async def get_chats(
    workspace_id: str,
    current_user: dict = Depends(gate)
):
    """Get all chats for a workspace"""
    handler = ChatHandler()
    try:
        chats = handler.get_workspace_chats(UUID(workspace_id))
        return [ChatDtoMapper.map_to_chat_dto(chat) for chat in chats]
    except Exception as e:
        logger.error(f"Error getting chats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chats")

@router.get("/{chat_id}", response_model=ChatDto)
async def get_chat(
    workspace_id: str,
    chat_id: str,
    current_user: dict = Depends(gate)
):
    """Get a specific chat"""
    handler = ChatHandler()
    try:
        chat = handler.get_chat(UUID(chat_id))
        return ChatDtoMapper.map_to_chat_dto(chat)
    except Exception as e:
        logger.error(f"Error getting chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chat")

@router.put("/{chat_id}", response_model=ChatDto)
async def update_chat(
    workspace_id: str,
    chat_id: str,
    command: ChatUpdateCommand,
    current_user: dict = Depends(gate)
):
    """Update a chat"""
    handler = ChatHandler()
    try:
        command.chat_id = chat_id
        chat = handler.update_chat(command)
        return ChatDtoMapper.map_to_chat_dto(chat)
    except Exception as e:
        logger.error(f"Error updating chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to update chat")

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    workspace_id: str,
    chat_id: str,
    current_user: dict = Depends(gate)
):
    """Delete a chat"""
    handler = ChatHandler()
    try:
        command = ChatDeleteCommand(chat_id=chat_id, workspace_id=workspace_id)
        handler.delete_chat(command)
    except Exception as e:
        logger.error(f"Error deleting chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete chat")

@router.post("/{chat_id}/messages", response_model=ChatMessageDto, status_code=status.HTTP_201_CREATED)
async def create_message(
    workspace_id: str,
    chat_id: str,
    command: ChatMessageCommand,
    current_user: dict = Depends(gate)
):
    """Create a new message in a chat"""
    handler = ChatHandler()
    try:
        command.chat_id = chat_id
        message = handler.create_message(command)
        return ChatMessageDtoMapper.map_to_chat_message_dto(message)
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail="Failed to create message")

@router.get("/{chat_id}/messages", response_model=List[ChatMessageDto])
async def get_messages(
    workspace_id: str,
    chat_id: str,
    current_user: dict = Depends(gate)
):
    """Get all messages in a chat"""
    handler = ChatHandler()
    try:
        messages = handler.get_chat_messages(UUID(chat_id))
        return [ChatMessageDtoMapper.map_to_chat_message_dto(message) for message in messages]
    except Exception as e:
        logger.error(f"Error getting messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to get messages")

@router.put("/{chat_id}/messages/{message_id}", response_model=ChatMessageDto)
async def update_message(
    workspace_id: str,
    chat_id: str,
    message_id: str,
    command: ChatMessageUpdateCommand,
    current_user: dict = Depends(gate)
):
    """Update a message"""
    handler = ChatHandler()
    try:
        command.message_id = message_id
        command.chat_id = chat_id
        message = handler.update_message(command)
        return ChatMessageDtoMapper.map_to_chat_message_dto(message)
    except Exception as e:
        logger.error(f"Error updating message: {e}")
        raise HTTPException(status_code=500, detail="Failed to update message")

@router.delete("/{chat_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    workspace_id: str,
    chat_id: str,
    message_id: str,
    current_user: dict = Depends(gate)
):
    """Delete a message"""
    handler = ChatHandler()
    try:
        command = ChatMessageDeleteCommand(message_id=message_id, chat_id=chat_id)
        handler.delete_message(command)
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete message")

@router.post("/{chat_id}/completion", response_model=ChatMessageDto)
async def create_completion(
    workspace_id: str,
    chat_id: str,
    current_user: dict = Depends(gate)
):
    """Get an AI completion for a chat, using its persisted message history.
    Call POST /{chat_id}/messages with the new user turn first."""
    handler = ChatHandler()
    try:
        message = handler.create_completion(UUID(chat_id))
        return ChatMessageDtoMapper.map_to_chat_message_dto(message)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating completion: {e}")
        raise HTTPException(status_code=500, detail="Failed to create completion")

chat_router = router 