from pydantic import BaseModel
from typing import Optional


class TaskCommand(BaseModel):
    workspace_id: Optional[str]
    title: Optional[str]
    description: Optional[str]
    priority: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    status: Optional[str]
    task_type: Optional[str]
    completed: Optional[bool]
    user_id: Optional[str]

class TaskDeleteCommand(BaseModel):
    task_id: Optional[str]
    user_id: Optional[str]


class TaskUpdateCommand(BaseModel):
    workspace_id: Optional[str]
    task_id: Optional[str]
    title: Optional[str]
    description: Optional[str]
    priority: Optional[str]
    status: Optional[str]
    completed: Optional[bool]
    published: Optional[bool]
    user_id: Optional[str]