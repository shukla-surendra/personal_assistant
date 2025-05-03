from typing import Optional
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
                name=command.name,
                description=command.description,
                type=command.type,
                content=command.content,
                is_public=command.is_public
            )
            self.db.add(template)
            self.db.commit()
            self.db.refresh(template)
            return template
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create template")

    def update_template(self, command: TemplateUpdateCommand) -> Template:
        try:
            template = self.db.query(Template).filter(Template.template_id == UUID(command.template_id)).first()
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")

            if command.name is not None:
                template.name = command.name
            if command.description is not None:
                template.description = command.description
            if command.type is not None:
                template.type = command.type
            if command.content is not None:
                template.content = command.content
            if command.is_public is not None:
                template.is_public = command.is_public

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

            self.db.delete(template)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete template")

    def __del__(self):
        self.db.close() 