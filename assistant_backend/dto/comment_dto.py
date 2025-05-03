from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class CommentDto(BaseModel):
    comment_id: str
    workspace_id: str
    content: str
    user_id: str

class CommentDtoMapper:
    @staticmethod
    def map_to_comment_dto(comment) -> CommentDto:
        return CommentDto(
            comment_id=str(comment.comment_id),
            workspace_id=str(comment.workspace_id),
            content=comment.content,
            user_id=str(comment.user_id)
        ) 