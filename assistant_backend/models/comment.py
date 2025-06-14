from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class Comment(BaseModel):
    """Comment model for user comments on tasks, pages, etc."""
    __tablename__ = "comments"

    content = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    task_id = Column(Integer, ForeignKey('tasks.id'), nullable=True)
    page_id = Column(Integer, ForeignKey('pages.id'), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="comments")
    task = relationship("Task", back_populates="comments")
    # page = relationship("Page", back_populates="comments")  # Uncomment if Page model exists
    
    def __repr__(self):
        return f"<Comment {self.id}>" 