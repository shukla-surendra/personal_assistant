from sqlalchemy import Column, String, ForeignKey, Table, Integer
from sqlalchemy.orm import relationship
from .base import BaseModel
from .user import user_workspace

class Workspace(BaseModel):
    """Workspace model for organizing users and resources."""
    __tablename__ = "workspaces"

    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    users = relationship("User", secondary=user_workspace, back_populates="workspaces")
    boards = relationship("Board", back_populates="workspace")
    tasks = relationship("Task", back_populates="workspace")
    pages = relationship("Page", back_populates="workspace")
    templates = relationship("Template", back_populates="workspace")
    databases = relationship("Database", back_populates="workspace")
    
    def __repr__(self):
        return f"<Workspace {self.name}>" 