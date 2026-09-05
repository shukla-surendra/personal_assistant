from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class TemplateDto(BaseModel):
    template_id: str
    workspace_id: str
    title: str
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    properties: Optional[Dict[str, Any]] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    tags: Optional[List[str]] = None

class TemplateDtoMapper:
    @staticmethod
    def map_to_template_dto(template) -> TemplateDto:
        return TemplateDto(
            template_id=str(template.template_id),
            workspace_id=str(template.workspace_id),
            title=template.title,
            description=template.description,
            content=template.content,
            properties=template.properties,
            icon=template.icon,
            cover=template.cover,
            tags=template.tags
        )