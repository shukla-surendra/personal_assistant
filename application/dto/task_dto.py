""""""
from typing import Optional, List
from pydantic import BaseModel
from utils.datetime_utils import datetime_to_str
from domain.models.dynamo_models import Board


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
    """ Task DTO """
    task_id: str
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    task_type: str
    status: str
    completed: bool = False
    is_deleted: Optional[bool] = False
    published: bool = False
    due_on: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    user_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


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
    def map_to_task_dto_mapper(task_object):
        # Priority mapping for converting between storage formats
        priority_map = {
            1: 'low',
            2: 'medium',
            3: 'high',
            'low': 'low',
            'medium': 'medium',
            'high': 'high'
        }

        # Handle dictionary input
        if isinstance(task_object, dict):
            # Convert priority to string format
            raw_priority = task_object.get('priority')
            priority = priority_map.get(raw_priority, 'medium')

            return TaskDto(
                task_id=str(task_object.get('task_id')),
                title=str(task_object.get('title')),
                description=task_object.get('description'),
                priority=priority,
                task_type=str(task_object.get('task_type')),
                status=str(task_object.get('status')),
                completed=task_object.get('completed', False),
                is_deleted=task_object.get('is_deleted', False),
                published=task_object.get('published', False),
                due_on=datetime_to_str(task_object.get('due_on')),
                start_time=datetime_to_str(task_object.get('start_time')),
                end_time=datetime_to_str(task_object.get('end_time')),
                user_id=str(task_object.get('user_id')),
                created_at=datetime_to_str(task_object.get('created_at')),
                updated_at=datetime_to_str(task_object.get('updated_at'))
            )
        # Handle object input
        # Convert priority to string format
        raw_priority = task_object.priority
        priority = priority_map.get(raw_priority, 'medium')

        return TaskDto(
            task_id=str(task_object.task_id),
            title=str(task_object.title),
            description=task_object.description,
            priority=priority,
            task_type=str(task_object.task_type.value),
            status=str(task_object.status.value),
            completed=task_object.completed,
            is_deleted=task_object.is_deleted,
            published=task_object.published,
            due_on=datetime_to_str(task_object.due_on),
            start_time=datetime_to_str(task_object.start_time),
            end_time=datetime_to_str(task_object.end_time),
            user_id=str(task_object.user_id),
            created_at=datetime_to_str(task_object.created_at),
            updated_at=datetime_to_str(task_object.updated_at)
        )
