from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class CommentDto(BaseModel):
    comment_id: str
    workspace_id: str
    entity_id: str
    entity_type: str
    content: str
    user_id: str
    parent_id: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    reactions: Optional[Dict[str, List[str]]] = None

class CommentDtoMapper:
    @staticmethod
    def map_to_comment_dto(comment) -> CommentDto:
        return CommentDto(
            comment_id=str(comment.comment_id),
            workspace_id=str(comment.workspace_id),
            entity_id=str(comment.entity_id),
            entity_type=comment.entity_type,
            content=comment.content,
            user_id=str(comment.user_id),
            parent_id=str(comment.parent_id) if comment.parent_id else None,
            properties=comment.properties,
            reactions=comment.reactions
        ) 