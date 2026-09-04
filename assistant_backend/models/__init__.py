"""
Importing every model module here is what registers each table on
Base.metadata before database/connection.py's init_db() calls
Base.metadata.create_all(). A model file that's never imported anywhere
is invisible to SQLAlchemy even though the class is defined in it —
that's what caused the "boards" NoReferencedTableError.

models/activity.py is currently empty (no model class) even though
main.py imports an activity_router — that router likely doesn't work
yet; left alone here since defining an Activity model isn't something
this fix should invent.
"""
from .base import Base, BaseModel
from .board import Board
from .calendar import CalendarEvent
from .comment import Comment
from .database import Database
from .notification import Notification
from .page import Page
from .reminder import Reminder
from .settings import UserSettings
from .task import Task, TaskStatus, TaskPriority
from .template import Template
from .timeblock import TimeBlock
from .user import User
from .workspace import Workspace
