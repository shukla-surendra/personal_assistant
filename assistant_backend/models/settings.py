from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class UserSettings(BaseModel):
    """User settings and preferences model."""
    
    __tablename__ = "user_settings"
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    assistant_settings = Column(JSON, default={
        "name": "Assistant",
        "voice_enabled": False,
        "voice_gender": "female",
        "language": "en",
        "timezone": "UTC",
        "notification_preferences": {
            "email": True,
            "push": True,
            "desktop": True
        }
    })
    theme_settings = Column(JSON, default={
        "mode": "light",
        "primary_color": "#007AFF",
        "font_size": "medium"
    })
    privacy_settings = Column(JSON, default={
        "data_collection": True,
        "analytics": True,
        "history_retention_days": 30
    })
    workspace_settings = Column(JSON, default={
        "default_view": "board",
        "sort_by": "due_date",
        "group_by": "status"
    })
    
    # Relationships
    user = relationship("User", back_populates="settings")
    
    def __repr__(self):
        return f"<UserSettings(user_id={self.user_id})>" 