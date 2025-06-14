from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import BaseModel

class TimeBlock(BaseModel):
    """TimeBlock model for time tracking on tasks."""
    __tablename__ = "timeblocks"

    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    description = Column(String, nullable=True)
    task_id = Column(Integer, ForeignKey('tasks.id'), nullable=False)
    
    # Relationships
    task = relationship("Task", back_populates="timeblocks")
    
    def __repr__(self):
        return f"<TimeBlock {self.id}>" 