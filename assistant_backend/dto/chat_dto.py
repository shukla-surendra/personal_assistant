from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

class ChatDto(BaseModel):
    chat_id: str
    workspace_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

class ChatMessageDto(BaseModel):
    message_id: str
    chat_id: str
    user_id: str
    content: str
    role: str
    properties: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

class ChatDtoMapper:
    @staticmethod
    def map_to_chat_dto(chat) -> ChatDto:
        return ChatDto(
            chat_id=str(chat.chat_id),
            workspace_id=str(chat.workspace_id),
            user_id=str(chat.user_id),
            title=chat.title,
            description=chat.description,
            properties=chat.properties,
            created_at=chat.created_at,
            updated_at=chat.updated_at
        )

class ChatMessageDtoMapper:
    @staticmethod
    def map_to_chat_message_dto(message) -> ChatMessageDto:
        return ChatMessageDto(
            message_id=str(message.message_id),
            chat_id=str(message.chat_id),
            user_id=str(message.user_id),
            content=message.content,
            role=message.role,
            properties=message.properties,
            created_at=message.created_at,
            updated_at=message.updated_at
        ) 