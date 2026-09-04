from typing import List
from uuid import UUID
from adapters.orm.models.pg_models import Chat, ChatMessage
from adapters.orm.models.database import SessionLocal
from commands.chat_cmd import ChatCommand, ChatUpdateCommand, ChatDeleteCommand, ChatMessageCommand, ChatMessageUpdateCommand, ChatMessageDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging
from openai import OpenAI
from config import settings

logger = logging.getLogger(__name__)


class ChatHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_chat(self, command: ChatCommand) -> Chat:
        try:
            chat = Chat(
                workspace_id=UUID(command.workspace_id),
                user_id=UUID(command.user_id),
                title=command.title,
                model=command.model,
                context=command.context
            )
            self.db.add(chat)
            self.db.commit()
            self.db.refresh(chat)
            return chat
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating chat: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create chat")

    def get_chat(self, chat_id: UUID) -> Chat:
        chat = self.db.query(Chat).filter(
            Chat.chat_id == chat_id,
            Chat.is_deleted == False
        ).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return chat

    def get_workspace_chats(self, workspace_id: UUID) -> List[Chat]:
        return self.db.query(Chat).filter(
            Chat.workspace_id == workspace_id,
            Chat.is_deleted == False
        ).all()

    def update_chat(self, command: ChatUpdateCommand) -> Chat:
        try:
            chat = self.db.query(Chat).filter(
                Chat.chat_id == UUID(command.chat_id),
                Chat.is_deleted == False
            ).first()
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found")

            if command.title is not None:
                chat.title = command.title
            if command.model is not None:
                chat.model = command.model
            if command.context is not None:
                chat.context = command.context

            self.db.commit()
            self.db.refresh(chat)
            return chat
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating chat: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update chat")

    def delete_chat(self, command: ChatDeleteCommand) -> bool:
        try:
            chat = self.db.query(Chat).filter(
                Chat.chat_id == UUID(command.chat_id),
                Chat.workspace_id == UUID(command.workspace_id)
            ).first()
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found")

            chat.is_deleted = True
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting chat: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete chat")

    def create_message(self, command: ChatMessageCommand) -> ChatMessage:
        try:
            message = ChatMessage(
                chat_id=UUID(command.chat_id),
                content=command.content,
                role=command.role,
                message_metadata=command.message_metadata
            )
            self.db.add(message)
            self.db.commit()
            self.db.refresh(message)
            return message
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating message: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create message")

    def get_chat_messages(self, chat_id: UUID) -> List[ChatMessage]:
        # ChatMessage has no is_deleted column (unlike most other models here) --
        # deletion is a real row delete, see delete_message below.
        return self.db.query(ChatMessage).filter(
            ChatMessage.chat_id == chat_id
        ).order_by(ChatMessage.created_at.asc()).all()

    def update_message(self, command: ChatMessageUpdateCommand) -> ChatMessage:
        try:
            message = self.db.query(ChatMessage).filter(
                ChatMessage.message_id == UUID(command.message_id)
            ).first()
            if not message:
                raise HTTPException(status_code=404, detail="Message not found")

            if command.content is not None:
                message.content = command.content
            if command.message_metadata is not None:
                message.message_metadata = command.message_metadata

            self.db.commit()
            self.db.refresh(message)
            return message
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating message: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update message")

    def delete_message(self, command: ChatMessageDeleteCommand) -> bool:
        try:
            message = self.db.query(ChatMessage).filter(
                ChatMessage.message_id == UUID(command.message_id),
                ChatMessage.chat_id == UUID(command.chat_id)
            ).first()
            if not message:
                raise HTTPException(status_code=404, detail="Message not found")

            self.db.delete(message)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting message: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete message")

    def create_completion(self, chat_id: UUID) -> ChatMessage:
        """Generate the assistant's reply to a chat and persist it.

        Reads chat history straight from the DB rather than trusting a
        client-supplied message list -- the caller is expected to have
        already persisted the new user turn via create_message() first, so
        by the time this runs, get_chat_messages() already reflects it. That
        also keeps this the single source of truth: a client can't spoof
        prior turns the server never actually saved.
        """
        chat = self.get_chat(chat_id)

        if not settings.OPENAI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="OPENAI_API_KEY is not configured on the backend"
            )

        try:
            history = self.get_chat_messages(chat_id)
            openai_messages = [{"role": m.role, "content": m.content} for m in history]

            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=chat.model,
                messages=openai_messages,
                temperature=0.7,
                max_tokens=1000
            )

            ai_message = ChatMessage(
                chat_id=chat_id,
                content=response.choices[0].message.content,
                role="assistant",
                message_metadata={"model": chat.model}
            )
            self.db.add(ai_message)
            self.db.commit()
            self.db.refresh(ai_message)
            return ai_message

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating completion: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create completion")

    def __del__(self):
        self.db.close()
