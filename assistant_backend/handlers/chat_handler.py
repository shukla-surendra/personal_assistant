from typing import List, Optional
from uuid import UUID
from adapters.orm.models.pg_models import Chat, ChatMessage
from adapters.orm.models.database import SessionLocal
from commands.chat_cmd import ChatCommand, ChatUpdateCommand, ChatDeleteCommand, ChatMessageCommand, ChatMessageUpdateCommand, ChatMessageDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging
import openai
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
                description=command.description,
                properties=command.properties
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
            if command.description is not None:
                chat.description = command.description
            if command.properties is not None:
                chat.properties = command.properties

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
                user_id=UUID(command.user_id),
                content=command.content,
                role=command.role,
                properties=command.properties
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
        return self.db.query(ChatMessage).filter(
            ChatMessage.chat_id == chat_id,
            ChatMessage.is_deleted == False
        ).order_by(ChatMessage.created_at.asc()).all()

    def update_message(self, command: ChatMessageUpdateCommand) -> ChatMessage:
        try:
            message = self.db.query(ChatMessage).filter(
                ChatMessage.message_id == UUID(command.message_id),
                ChatMessage.is_deleted == False
            ).first()
            if not message:
                raise HTTPException(status_code=404, detail="Message not found")

            if command.content is not None:
                message.content = command.content
            if command.properties is not None:
                message.properties = command.properties

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

            message.is_deleted = True
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting message: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete message")

    def create_completion(self, chat_id: UUID, request: dict) -> dict:
        try:
            # Get chat history
            messages = self.get_chat_messages(chat_id)
            chat_history = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]

            # Add the new user message
            chat_history.append({
                "role": "user",
                "content": request.get("content", "")
            })

            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model=settings.OPENAI_MODEL,
                messages=chat_history,
                temperature=0.7,
                max_tokens=1000
            )

            # Save the AI response
            ai_message = ChatMessage(
                chat_id=chat_id,
                user_id=UUID(request.get("user_id")),
                content=response.choices[0].message.content,
                role="assistant",
                properties={"model": settings.OPENAI_MODEL}
            )
            self.db.add(ai_message)
            self.db.commit()
            self.db.refresh(ai_message)

            return {
                "message": ai_message.content,
                "role": ai_message.role,
                "created_at": ai_message.created_at
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating completion: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create completion")

    def __del__(self):
        self.db.close() 