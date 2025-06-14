from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Database(BaseModel):
    """Database model for custom user databases (tables)."""
    __tablename__ = "databases"

    name = Column(String, nullable=False)
    schema = Column(JSON, nullable=True)  # Store table schema/fields
    workspace_id = Column(Integer, ForeignKey('workspaces.id'), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="databases")
    
    def __repr__(self):
        return f"<Database {self.name}>" 