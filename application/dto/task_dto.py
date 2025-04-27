""""""
from typing import Optional, List
from pydantic import BaseModel
from utils.datetime_utils import datetime_to_str
from domain.models.dynamo_models import Board
from application.dto.base_dto import BaseDto
from models import Task
from datetime import datetime


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


class TaskDto(BaseDto):
    task_id: str
    workspace_id: str
    board_id: Optional[str]
    user_id: str
    title: str
    description: Optional[str]
    priority: int
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
    published: bool
    public: bool
    slug: Optional[str]
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
            task_type=task.task_type.value,
            status=task.status.value,
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
            published=task.published,
            public=task.public,
            slug=task.slug,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
