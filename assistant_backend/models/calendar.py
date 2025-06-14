from .base import BaseModel
from sqlalchemy import Column, Integer, String

class CalendarEvent(BaseModel):
    __tablename__ = "calendar_events"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    # Add more fields as needed 