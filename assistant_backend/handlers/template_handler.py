from uuid import UUID
from adapters.orm.models.pg_models import Template
from adapters.orm.models.database import SessionLocal
from commands.template_cmd import TemplateCommand, TemplateUpdateCommand, TemplateDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class TemplateHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_template(self, command: TemplateCommand) -> Template:
        try:
            template = Template(
                workspace_id=UUID(command.workspace_id),
                title=command.title,
                description=command.description,
                icon=command.icon,
                cover=command.cover,
                content=command.content,
                properties=command.properties,
                tags=command.tags,
            )
            self.db.add(template)
            self.db.commit()
            self.db.refresh(template)
            return template
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create template")

    def get_template(self, template_id: str) -> Template:
        template = self.db.query(Template).filter(
            Template.template_id == UUID(template_id),
            Template.is_deleted == False
        ).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template

    def list_templates(self, workspace_id: str) -> list[Template]:
        try:
            return self.db.query(Template).filter(
                Template.workspace_id == UUID(workspace_id),
                Template.is_deleted == False
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing templates: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list templates")

    def update_template(self, command: TemplateUpdateCommand) -> Template:
        try:
            template = self.db.query(Template).filter(Template.template_id == UUID(command.template_id)).first()
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")

            if command.title is not None:
                template.title = command.title
            if command.description is not None:
                template.description = command.description
            if command.icon is not None:
                template.icon = command.icon
            if command.cover is not None:
                template.cover = command.cover
            if command.content is not None:
                template.content = command.content
            if command.properties is not None:
                template.properties = command.properties
            if command.tags is not None:
                template.tags = command.tags

            self.db.commit()
            self.db.refresh(template)
            return template
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update template")

    def delete_template(self, command: TemplateDeleteCommand) -> bool:
        try:
            template = self.db.query(Template).filter(
                Template.template_id == UUID(command.template_id),
                Template.workspace_id == UUID(command.workspace_id)
            ).first()
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")

            template.is_deleted = True
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete template")

    def __del__(self):
        self.db.close()
