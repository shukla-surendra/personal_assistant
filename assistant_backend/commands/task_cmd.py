from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from config import logger
from uuid import UUID


class TaskCommand(BaseModel):
    task_id: Optional[str] = None  # Will be generated if not provided
    workspace_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    task_type: Optional[str] = "todo"
    status: Optional[str] = "todo"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    published: bool = False
    slug: Optional[str] = None
    board_id: Optional[str] = None
    completed: bool = False
    is_deleted: bool = False
    due_on: Optional[datetime] = None
    assignee_id: Optional[str] = None
    reporter_id: Optional[str] = None
    watchers: Optional[list] = []
    labels: Optional[list] = []
    meta_data: Optional[dict] = {}
    settings: Optional[dict] = {}
    public: bool = False


class TaskDeleteCommand(BaseModel):
    task_id: str
    user_id: str


class TaskUpdateCommand(BaseModel):
    task_id: str
    workspace_id: str
    user_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    task_type: Optional[str] = None
    status: Optional[str] = None
    completed: Optional[bool] = None
    published: Optional[bool] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    due_on: Optional[datetime] = None
    is_deleted: Optional[bool] = None

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


class TimeBlockCommand(BaseModel):
    workspace_id: str
    user_id: str
    start_time: datetime
    end_time: datetime
    description: str
    status: str = "pending"

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class TimeBlockUpdateCommand(BaseModel):
    id: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    description: Optional[str] = None
    status: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }