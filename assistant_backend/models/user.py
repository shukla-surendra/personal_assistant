from sqlalchemy import Column, String, Boolean, ForeignKey, Table, Integer
from sqlalchemy.orm import relationship
from .base import BaseModel

# Association table for user workspaces
user_workspace = Table(
    'user_workspace',
    BaseModel.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('workspace_id', Integer, ForeignKey('workspaces.id'), primary_key=True)
)

class User(BaseModel):
    """User model for authentication and user management."""
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Relationships
    workspaces = relationship("Workspace", secondary=user_workspace, back_populates="users")
    tasks = relationship("Task", back_populates="assignee")
    comments = relationship("Comment", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    reminders = relationship("Reminder", back_populates="user")
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    
    def __repr__(self):
        return f"<User {self.email}>" 