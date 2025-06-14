from sqlalchemy import Column, String, Integer, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    ARCHIVED = "archived"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Task(BaseModel):
    """Task model for managing tasks and to-dos."""
    __tablename__ = "tasks"

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    due_date = Column(String, nullable=True)  # ISO format date string
    estimated_hours = Column(Integer, nullable=True)
    actual_hours = Column(Integer, nullable=True)
    task_metadata = Column(JSON, nullable=True)  # For additional task properties
    
    # Foreign Keys
    workspace_id = Column(Integer, ForeignKey('workspaces.id'), nullable=False)
    board_id = Column(Integer, ForeignKey('boards.id'), nullable=True)
    assignee_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    parent_task_id = Column(Integer, ForeignKey('tasks.id'), nullable=True)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="tasks")
    board = relationship("Board", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="tasks")
    creator = relationship("User", foreign_keys=[creator_id])
    parent_task = relationship("Task", remote_side=[id], backref="subtasks")
    comments = relationship("Comment", back_populates="task")
    timeblocks = relationship("TimeBlock", back_populates="task")
    activities = relationship("Activity", back_populates="task")
    
    def __repr__(self):
        return f"<Task {self.title}>" 