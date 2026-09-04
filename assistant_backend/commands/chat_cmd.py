from pydantic import BaseModel
from typing import Optional, Dict, Any

# Field names here match adapters/orm/models/pg_models.py's Chat/ChatMessage
# columns exactly (chat.model/context, message.message_metadata -- neither
# model has a description/properties/user_id-on-message column). A second,
# unused schema family (ChatCreate/ChatResponse/ChatCompletionRequest) used
# to live here with different field names that didn't match either the
# model or this one; removed rather than left as dead, confusing scaffolding.

class ChatCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    user_id: Optional[str] = None  # Set from the auth token by the controller
    title: str
    model: str = "gpt-3.5-turbo"
    context: Optional[Dict[str, Any]] = None

class ChatUpdateCommand(BaseModel):
    chat_id: Optional[str] = None  # Set from the URL path by the controller
    title: Optional[str] = None
    model: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatDeleteCommand(BaseModel):
    chat_id: str
    workspace_id: str

class ChatMessageCommand(BaseModel):
    chat_id: Optional[str] = None  # Set from the URL path by the controller
    content: str
    role: str
    message_metadata: Optional[Dict[str, Any]] = None

class ChatMessageUpdateCommand(BaseModel):
    message_id: Optional[str] = None  # Set from the URL path by the controller
    chat_id: Optional[str] = None  # Set from the URL path by the controller
    content: Optional[str] = None
    message_metadata: Optional[Dict[str, Any]] = None

class ChatMessageDeleteCommand(BaseModel):
    message_id: str
    chat_id: str
