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
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    email_notifications = Column(Boolean, default=True)
    task_reminders = Column(Boolean, default=True)
    weekly_digest = Column(Boolean, default=True)
    language = Column(String, default="en")
    timezone = Column(String, default="UTC")
    theme = Column(String, default="light")
    preferences = Column(JSONB, nullable=True, default={})
    notification_settings = Column(JSONB, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="settings")
    workspace = relationship("Workspace")

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
    public_access = Column(Boolean, default=False)
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
    contacts = relationship("Contact", back_populates="workspace")
    deals = relationship("Deal", back_populates="workspace")
    contact_activities = relationship("ContactActivity", back_populates="workspace")
    deal_activities = relationship("DealActivity", back_populates="workspace")

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

class Contact(Base):
    __tablename__ = "contacts"

    contact_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    address = Column(JSONB, nullable=True)
    social_media = Column(JSONB, nullable=True)
    tags = Column(JSONB, nullable=True)
    status = Column(String, nullable=False, default="active")
    source = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    properties = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="contacts")
    deals = relationship("Deal", back_populates="contact")
    activities = relationship("ContactActivity", back_populates="contact")

class Deal(Base):
    __tablename__ = "deals"

    deal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.contact_id"), nullable=False)
    title = Column(String, nullable=False)
    value = Column(Integer, nullable=True)
    currency = Column(String, nullable=True, default="USD")
    stage = Column(String, nullable=False)
    probability = Column(Integer, nullable=True)
    expected_close_date = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(JSONB, nullable=True)
    status = Column(String, nullable=False, default="active")
    properties = Column(JSONB, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="deals")
    contact = relationship("Contact", back_populates="deals")
    activities = relationship("DealActivity", back_populates="deal")

class ContactActivity(Base):
    __tablename__ = "contact_activities"

    activity_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.contact_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    type = Column(String, nullable=False)  # email, call, meeting, note
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="pending")
    properties = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="contact_activities")
    contact = relationship("Contact", back_populates="activities")
    user = relationship("User")

class DealActivity(Base):
    __tablename__ = "deal_activities"

    activity_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.workspace_id"), nullable=False)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.deal_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    type = Column(String, nullable=False)  # stage_change, note, task
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    old_stage = Column(String, nullable=True)
    new_stage = Column(String, nullable=True)
    properties = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="deal_activities")
    deal = relationship("Deal", back_populates="activities")
    user = relationship("User")