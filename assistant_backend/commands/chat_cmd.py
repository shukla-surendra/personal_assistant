from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class ChatBase(BaseModel):
    title: str
    model: str = "gpt-3.5-turbo"
    context: Optional[Dict[str, Any]] = None

class ChatCreate(ChatBase):
    workspace_id: UUID
    user_id: UUID

class ChatUpdate(ChatBase):
    pass

class ChatResponse(ChatBase):
    chat_id: UUID
    workspace_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    role: str
    content: str
    metadata: Optional[Dict[str, Any]] = None

class ChatMessageCreate(ChatMessageBase):
    chat_id: UUID

class ChatMessageResponse(ChatMessageBase):
    message_id: UUID
    chat_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatCompletionRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: Optional[str] = "gpt-3.5-turbo"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False

class ChatCommand(BaseModel):
    workspace_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class ChatUpdateCommand(BaseModel):
    chat_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class ChatDeleteCommand(BaseModel):
    chat_id: str
    workspace_id: str

class ChatMessageCommand(BaseModel):
    chat_id: str
    user_id: str
    content: str
    role: str
    properties: Optional[Dict[str, Any]] = None

class ChatMessageUpdateCommand(BaseModel):
    message_id: str
    chat_id: str
    content: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class ChatMessageDeleteCommand(BaseModel):
    message_id: str
    chat_id: str 