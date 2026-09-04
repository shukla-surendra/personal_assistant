from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Board(BaseModel):
    """Board model for organizing tasks in a kanban-style board."""
    __tablename__ = "boards"

    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    layout = Column(JSON, nullable=True)  # Store board layout configuration
    board_metadata = Column(JSON, nullable=True)  # Additional board properties ('metadata' is reserved by SQLAlchemy's Declarative API)
    
    # Foreign Keys
    workspace_id = Column(Integer, ForeignKey('workspaces.id'), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="boards")
    creator = relationship("User", foreign_keys=[creator_id])
    tasks = relationship("Task", back_populates="board")
    activities = relationship("Activity", back_populates="board")
    
    def __repr__(self):
        return f"<Board {self.name}>" 