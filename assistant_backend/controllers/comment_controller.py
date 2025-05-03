from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from handlers.comment_handler import CommentHandler
from commands.comment_cmd import CommentCommand, CommentUpdateCommand, CommentDeleteCommand
from adapters.orm.models.pg_models import Comment
from dto.comment_dto import CommentDto
from dto.comment_dto import CommentDtoMapper

router = APIRouter(prefix="/comments", tags=["comments"])

@router.post("/", response_model=CommentDto, status_code=status.HTTP_201_CREATED)
async def create_comment(command: CommentCommand):
    handler = CommentHandler()
    try:
        comment = handler.create_comment(command)
        return CommentDtoMapper.map_to_comment_dto(comment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{comment_id}", response_model=CommentDto)
async def update_comment(comment_id: str, command: CommentUpdateCommand):
    handler = CommentHandler()
    try:
        command.comment_id = comment_id
        comment = handler.update_comment(command)
        return CommentDtoMapper.map_to_comment_dto(comment)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: str, workspace_id: str):
    handler = CommentHandler()
    try:
        command = CommentDeleteCommand(comment_id=comment_id, workspace_id=workspace_id)
        handler.delete_comment(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{comment_id}", response_model=CommentDto)
async def get_comment(comment_id: str):
    handler = CommentHandler()
    try:
        comment = handler.get_comment(comment_id)
        return CommentDtoMapper.map_to_comment_dto(comment)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[CommentDto])
async def list_comments(workspace_id: str, parent_id: str, parent_type: str):
    handler = CommentHandler()
    try:
        comments = handler.list_comments(workspace_id, parent_id, parent_type)
        return [CommentDtoMapper.map_to_comment_dto(comment) for comment in comments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 