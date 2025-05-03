from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Enum as SQLEnum, Table, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from adapters.orm.models.database import Base
from constants import TaskStatus, TaskType, UserStatus, UserRoles, UserType
from datetime import datetime

# Association tables
workspace_users = Table(
    'workspace_users',
    Base.metadata,
    Column('workspace_id', UUID(as_uuid=True), ForeignKey('workspaces.workspace_id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.user_id'), primary_key=True),
    Column('role', String(50), nullable=False, server_default='member'),
    Column('created_at', DateTime, default=datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
)

task_tags = Table(
    'task_tags',
    Base.metadata,
    Column('task_id', UUID(as_uuid=True), ForeignKey('tasks.task_id'), primary_key=True),
    Column('tag_id', UUID(as_uuid=True), ForeignKey('tags.id'), primary_key=True),
    Column('created_at', DateTime, default=datetime.utcnow)
)

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    country_code = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    google_id = Column(String, nullable=True)
    status = Column(String, nullable=False, default="ACTIVE")
    role = Column(String, nullable=False, default="USER")
    user_type = Column(String, nullable=False, default="FREE")
    preferences = Column(JSONB, nullable=True, default={})
    is_deleted = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    otp = Column(String, nullable=True)
    otp_time = Column(DateTime, nullable=True)
    default_workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    default_workspace = relationship("Workspace", foreign_keys=[default_workspace_id])
    workspaces = relationship("Workspace", secondary=workspace_users, back_populates="users")
    tasks = relationship("Task", foreign_keys="Task.user_id", back_populates="user")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")
    reported_tasks = relationship("Task", foreign_keys="Task.reporter_id", back_populates="reporter")
    assigned_items = relationship("BoardItem", foreign_keys="BoardItem.assignee_id", back_populates="assignee")
    comments = relationship("Comment", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    reminders = relationship("Reminder", back_populates="user")
    settings = relationship("UserSettings", back_populates="user", uselist=False)

class UserSettings(Base):
    __tablename__ = "user_settings"

    settings_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, unique=True)
    preferences = Column(JSONB, nullable=True)
    theme = Column(String, nullable=True)
    language = Column(String, nullable=True)
    timezone = Column(String, nullable=True)
    notification_settings = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="settings")

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.board_id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, nullable=False)
    task_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    due_on = Column(DateTime, nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    watchers = Column(JSONB, nullable=True)
    labels = Column(JSONB, nullable=True)
    meta_data = Column(JSONB, nullable=True)
    settings = Column(JSONB, nullable=True)
    published = Column(Boolean, default=False)
    public = Column(Boolean, default=False)
    slug = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="tasks")
    board = relationship("Board", back_populates="tasks")
    user = relationship("User", foreign_keys=[user_id], back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_tasks")
    comments = relationship("Comment", back_populates="task")
    tags = relationship("Tag", secondary=task_tags, back_populates="tasks")

class Workspace(Base):
    __tablename__ = "workspaces"

    workspace_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    cover = Column(String, nullable=True)
    properties = Column(JSONB, nullable=True)
    members = Column(JSONB, nullable=True)
    settings = Column(JSONB, nullable=True)
    is_public = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", foreign_keys=[owner_id])
    tasks = relationship("Task", back_populates="workspace")
    users = relationship("User", secondary=workspace_users, back_populates="workspaces")
    boards = relationship("Board", back_populates="workspace")
    pages = relationship("Page", back_populates="workspace")
    databases = relationship("Database", back_populates="workspace")
    templates = relationship("Template", back_populates="workspace")
    activities = relationship("Activity", back_populates="workspace")
    integrations = relationship("Integration", back_populates="workspace")
    comments = relationship("Comment", back_populates="workspace")
    notifications = relationship("Notification", back_populates="workspace")
    reminders = relationship("Reminder", back_populates="workspace")

class Board(Base):
    __tablename__ = "boards"

    board_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    properties = Column(JSONB, nullable=True)
    views = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="boards")
    items = relationship("BoardItem", back_populates="board")
    tasks = relationship("Task", back_populates="board")

class BoardItem(Base):
    __tablename__ = "board_items"

    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.board_id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    properties = Column(JSONB, nullable=True)
    order = Column(Integer, nullable=True)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    board = relationship("Board", back_populates="items")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_items")

class Reminder(Base):
    __tablename__ = "reminders"

    reminder_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=False)
    repeat = Column(String, nullable=True)
    properties = Column(JSONB, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="reminders")
    user = relationship("User", back_populates="reminders")

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    entity_type = Column(String, nullable=True)
    properties = Column(JSONB, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="notifications")
    user = relationship("User", back_populates="notifications")

class Comment(Base):
    __tablename__ = "comments"

    comment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.task_id"), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    entity_type = Column(String, nullable=True)
    content = Column(String, nullable=False)
    properties = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="comments")
    user = relationship("User", back_populates="comments")
    task = relationship("Task", back_populates="comments")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    color = Column(String, default="#808080")
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks = relationship("Task", secondary=task_tags, back_populates="tags")

class Page(Base):
    __tablename__ = "pages"

    page_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(JSONB, nullable=True)
    properties = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="pages")
    blocks = relationship("Block", back_populates="page")

class Block(Base):
    __tablename__ = "blocks"

    block_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.page_id"), nullable=False)
    type = Column(String, nullable=False)
    content = Column(JSONB, nullable=True)
    properties = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    page = relationship("Page", back_populates="blocks")

class Database(Base):
    __tablename__ = "databases"

    database_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    properties = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="databases")
    entries = relationship("DatabaseEntry", back_populates="database")

class DatabaseEntry(Base):
    __tablename__ = "database_entries"

    entry_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    database_id = Column(UUID(as_uuid=True), ForeignKey("databases.database_id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(JSONB, nullable=True)
    properties = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    database = relationship("Database", back_populates="entries")

class Template(Base):
    __tablename__ = "templates"

    template_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    cover = Column(String, nullable=True)
    content = Column(JSONB, nullable=True)
    properties = Column(JSONB, nullable=True)
    tags = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="templates")

class Activity(Base):
    __tablename__ = "activities"

    activity_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    details = Column(JSONB, nullable=True)
    properties = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="activities")
    user = relationship("User", back_populates="activities")

class Integration(Base):
    __tablename__ = "integrations"

    integration_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    settings = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="integrations")