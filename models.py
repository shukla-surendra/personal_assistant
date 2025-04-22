from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, JSON, Enum as SQLEnum, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from database import Base
from constants import TaskStatus, TaskType, UserStatus, UserRoles, UserType, TaskPriority

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String)
    first_name = Column(String, nullable=False)
    last_name = Column(String)
    country_code = Column(String(10))
    mobile_number = Column(String(20))
    google_id = Column(String)
    last_login = Column(DateTime(timezone=True))
    status = Column(SQLEnum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    role = Column(SQLEnum(UserRoles), nullable=False, default=UserRoles.USER)
    user_type = Column(SQLEnum(UserType), nullable=False, default=UserType.FREE)
    preferences = Column(JSON, default={})
    is_deleted = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    verification_token = Column(String)
    otp = Column(String(6))
    otp_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class TaskPriority(SQLEnum):
    __tablename__ = "task_priority"

    LOW = 1
    MEDIUM = 2
    HIGH = 3

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.board_id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    priority = Column(Integer, nullable=False, default=TaskPriority.MEDIUM)
    task_type = Column(SQLEnum(TaskType), nullable=False, default=TaskType.TODO)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    completed = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    due_on = Column(DateTime(timezone=True))
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    watchers = Column(JSON, default=[])
    labels = Column(JSON, default=[])
    meta_data = Column(JSON, default={})
    settings = Column(JSON, default={})
    published = Column(Boolean, default=False)
    public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace = relationship("Workspace", back_populates="tasks")
    board = relationship("Board", back_populates="tasks")
    user = relationship("User", foreign_keys=[user_id])
    assignee = relationship("User", foreign_keys=[assignee_id])
    reporter = relationship("User", foreign_keys=[reporter_id])

# Define the workspace_users association table
workspace_users = Table(
    'workspace_users',
    Base.metadata,
    Column('workspace_id', UUID(as_uuid=True), ForeignKey('workspaces.workspace_id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.user_id'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
)

class Workspace(Base):
    __tablename__ = "workspaces"

    workspace_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    settings = Column(JSON, default={})
    meta_data = Column(JSON, default={})
    system_default = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tasks = relationship("Task", back_populates="workspace")
    owner = relationship("User")
    users = relationship("User", secondary=workspace_users, backref="workspaces")

class Board(Base):
    __tablename__ = "boards"

    board_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    labels = Column(JSON, default=[])
    settings = Column(JSON, default={})
    meta_data = Column(JSON, default={})
    status = Column(String, default="active")
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tasks = relationship("Task", back_populates="board")
    owner = relationship("User") 