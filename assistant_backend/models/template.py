from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Template(BaseModel):
    """Template model for reusable task/page/database templates."""
    __tablename__ = "templates"

    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    content = Column(JSON, nullable=True)
    workspace_id = Column(Integer, ForeignKey('workspaces.id'), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="templates")
    
    def __repr__(self):
        return f"<Template {self.name}>" 