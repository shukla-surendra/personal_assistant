""""""
from typing import Optional, List
from pydantic import BaseModel
from utils.datetime_utils import datetime_to_str
from adapters.orm.models.pg_models import Task, Comment, Tag
from datetime import datetime

class CommentDto(BaseModel):
    comment_id: str
    task_id: str
    user_id: str
    content: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None
    replies: List['CommentDto'] = []

class TagDto(BaseModel):
    id: str
    name: str
    color: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class BoardDto(BaseModel):
    """ Board Dto """
    board_id: str
    name: str
    description: Optional[str] = None
    users: List = []
    owner: str
    labels: List = []
    status: str
    is_deleted: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TaskDto(BaseModel):
    task_id: str
    workspace_id: str
    board_id: Optional[str]
    user_id: str
    title: str
    description: Optional[str]
    priority: str
    task_type: str
    status: str
    completed: bool
    is_deleted: bool
    due_on: Optional[datetime]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    assignee_id: Optional[str]
    reporter_id: Optional[str]
    watchers: list
    labels: list
    meta_data: dict
    settings: dict
    public_access: bool
    slug: Optional[str]
    created_at: datetime
    updated_at: datetime
    comments: List[CommentDto] = []
    tags: List[TagDto] = []


class TimeBlockDto(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    start_time: datetime
    end_time: datetime
    description: str
    status: str
    created_at: datetime
    updated_at: datetime







class BoardDtoMapper:
    @staticmethod
    def map_to_board_dto_mapper(board_object):
        # Handle dictionary input
        if isinstance(board_object, dict):
            return BoardDto(
                board_id=str(board_object.get('board_id')),
                name=str(board_object.get('name')),
                description=board_object.get('description'),
                users=board_object.get('users', []),
                labels=board_object.get('labels', []),
                status=str(board_object.get('status')),
                owner=str(board_object.get('owner')),
                # is_deleted=board_object.get('is_deleted', False),
                created_at=board_object.get('created_at'),
                updated_at=board_object.get('updated_at')
            )
        # Handle object input
        return BoardDto(
            board_id=str(board_object.board_id),
            name=str(board_object.name),
            description=board_object.description,
            users=board_object.users,
            labels=board_object.labels,
            status=str(board_object.status.value),
            owner=str(board_object.owner),
            is_deleted=board_object.is_deleted,
            created_at=datetime_to_str(board_object.created_at),
            updated_at=datetime_to_str(board_object.updated_at)
        )


class CommentDtoMapper:
    @staticmethod
    def map_to_comment_dto(comment: Comment) -> CommentDto:
        return CommentDto(
            comment_id=str(comment.comment_id),
            task_id=str(comment.task_id),
            user_id=str(comment.user_id),
            content=comment.content,
            is_deleted=comment.is_deleted,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            user={
                'user_id': str(comment.user.user_id),
                'first_name': comment.user.first_name,
                'last_name': comment.user.last_name
            } if comment.user else None
        )


class TagDtoMapper:
    @staticmethod
    def map_to_tag_dto(tag: Tag) -> TagDto:
        return TagDto(
            id=str(tag.id),
            name=tag.name,
            color=tag.color,
            description=tag.description,
            created_at=tag.created_at,
            updated_at=tag.updated_at
        )


class TaskDtoMapper:
    """ Task Dto Mapper """
    @staticmethod
    def map_to_task_dto_mapper(task: Task) -> TaskDto:
        return TaskDto(
            task_id=str(task.task_id),
            workspace_id=str(task.workspace_id),
            board_id=str(task.board_id) if task.board_id else None,
            user_id=str(task.user_id),
            title=task.title,
            description=task.description,
            priority=task.priority,
            task_type=task.task_type,
            status=task.status,
            completed=task.completed,
            is_deleted=task.is_deleted,
            due_on=task.due_on,
            start_time=task.start_time,
            end_time=task.end_time,
            assignee_id=str(task.assignee_id) if task.assignee_id else None,
            reporter_id=str(task.reporter_id) if task.reporter_id else None,
            watchers=task.watchers,
            labels=task.labels,
            meta_data=task.meta_data,
            settings=task.settings,
            public_access=task.public_access,
            slug=task.slug,
            created_at=task.created_at,
            updated_at=task.updated_at,
            comments=[CommentDtoMapper.map_to_comment_dto(comment) for comment in task.comments if not comment.is_deleted],
            tags=[TagDtoMapper.map_to_tag_dto(tag) for tag in task.tags]
        )
