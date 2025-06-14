from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Page(BaseModel):
    """Page model for notes, wikis, and documents."""
    __tablename__ = "pages"

    title = Column(String, nullable=False)
    content = Column(JSON, nullable=True)
    workspace_id = Column(Integer, ForeignKey('workspaces.id'), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="pages")
    creator = relationship("User", foreign_keys=[creator_id])
    # comments = relationship("Comment", back_populates="page")  # Uncomment if needed
    
    def __repr__(self):
        return f"<Page {self.title}>" 