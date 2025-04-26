from enum import Enum
import uuid


class UserStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class TaskStatus(Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class TaskType(Enum):
    TASK = "task"
    TODO = "todo"
    NOTE = "note"
    QUICK_NOTE = "quick_note"
    BUG = "bug"
    FEATURE = "feature"
    ENHANCEMENT = "enhancement"


class UserRoles(Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class UserType(Enum):
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class OID(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        try:
            return str(uuid.UUID(v))
        except ValueError:
            raise ValueError("Not a valid UUID")


class TaskPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
