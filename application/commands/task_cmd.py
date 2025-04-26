from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from config import logger


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
    published: Optional[bool]
    user_id: Optional[str]


class TaskDeleteCommand(BaseModel):
    task_id: Optional[str]
    user_id: Optional[str]


class TaskUpdateCommand(BaseModel):
    workspace_id: Optional[str] = None
    task_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    completed: Optional[bool] = None
    published: Optional[bool] = None
    user_id: Optional[str] = None
    task_type: Optional[str] = None
    is_deleted: Optional[bool] = None
    due_on: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

    def __init__(self, **data):
        try:
            logger.info(f"Received TaskUpdateCommand data: {data}")
            super().__init__(**data)
            logger.info(f"Successfully validated TaskUpdateCommand: {self.dict()}")
        except Exception as e:
            logger.error(f"Error validating TaskUpdateCommand: {str(e)}")
            logger.error(f"Invalid data received: {data}")
            raise