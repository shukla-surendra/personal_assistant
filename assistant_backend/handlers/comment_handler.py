from typing import Optional
from uuid import UUID
from adapters.orm.models.pg_models import Comment
from adapters.orm.models.database import SessionLocal
from commands.comment_cmd import CommentCommand, CommentUpdateCommand, CommentDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class CommentHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_comment(self, command: CommentCommand) -> Comment:
        try:
            comment = Comment(
                workspace_id=UUID(command.workspace_id),
                content=command.content,
                parent_id=UUID(command.parent_id),
                parent_type=command.parent_type,
                properties=command.properties
            )
            self.db.add(comment)
            self.db.commit()
            self.db.refresh(comment)
            return comment
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating comment: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create comment")

    def update_comment(self, command: CommentUpdateCommand) -> Comment:
        try:
            comment = self.db.query(Comment).filter(Comment.comment_id == UUID(command.comment_id)).first()
            if not comment:
                raise HTTPException(status_code=404, detail="Comment not found")

            if command.content is not None:
                comment.content = command.content
            if command.properties is not None:
                comment.properties = command.properties

            self.db.commit()
            self.db.refresh(comment)
            return comment
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating comment: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update comment")

    def delete_comment(self, command: CommentDeleteCommand) -> bool:
        try:
            comment = self.db.query(Comment).filter(
                Comment.comment_id == UUID(command.comment_id),
                Comment.workspace_id == UUID(command.workspace_id)
            ).first()
            if not comment:
                raise HTTPException(status_code=404, detail="Comment not found")

            self.db.delete(comment)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting comment: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete comment")

    def __del__(self):
        self.db.close() 