from typing import Optional
from uuid import UUID
from adapters.orm.models.pg_models import Page, Block
from adapters.orm.models.database import SessionLocal
from commands.page_cmd import PageCommand, PageUpdateCommand, PageDeleteCommand, BlockCommand, BlockUpdateCommand, BlockDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class PageHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_page(self, command: PageCommand) -> Page:
        try:
            page = Page(
                workspace_id=UUID(command.workspace_id),
                title=command.title,
                content=command.content,
                parent_id=UUID(command.parent_id) if command.parent_id else None,
                icon=command.icon,
                cover=command.cover,
                properties=command.properties,
                is_template=command.is_template,
                is_public=command.is_public
            )
            self.db.add(page)
            self.db.commit()
            self.db.refresh(page)
            return page
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating page: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create page")

    def list_pages(self, workspace_id: str) -> list[Page]:
        try:
            return self.db.query(Page).filter(Page.workspace_id == UUID(workspace_id)).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing pages: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list pages")

    def update_page(self, command: PageUpdateCommand) -> Page:
        try:
            page = self.db.query(Page).filter(Page.page_id == UUID(command.page_id)).first()
            if not page:
                raise HTTPException(status_code=404, detail="Page not found")

            if command.title is not None:
                page.title = command.title
            if command.content is not None:
                page.content = command.content
            if command.parent_id is not None:
                page.parent_id = UUID(command.parent_id)
            if command.icon is not None:
                page.icon = command.icon
            if command.cover is not None:
                page.cover = command.cover
            if command.properties is not None:
                page.properties = command.properties
            if command.is_template is not None:
                page.is_template = command.is_template
            if command.is_public is not None:
                page.is_public = command.is_public

            self.db.commit()
            self.db.refresh(page)
            return page
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating page: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update page")

    def delete_page(self, command: PageDeleteCommand) -> bool:
        try:
            page = self.db.query(Page).filter(
                Page.page_id == UUID(command.page_id),
                Page.workspace_id == UUID(command.workspace_id)
            ).first()
            if not page:
                raise HTTPException(status_code=404, detail="Page not found")

            self.db.delete(page)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting page: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete page")

    def create_block(self, command: BlockCommand) -> Block:
        try:
            block = Block(
                page_id=UUID(command.page_id),
                type=command.type,
                content=command.content,
                parent_id=UUID(command.parent_id) if command.parent_id else None,
                properties=command.properties,
                order=command.order
            )
            self.db.add(block)
            self.db.commit()
            self.db.refresh(block)
            return block
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating block: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create block")

    def update_block(self, command: BlockUpdateCommand) -> Block:
        try:
            block = self.db.query(Block).filter(Block.block_id == UUID(command.block_id)).first()
            if not block:
                raise HTTPException(status_code=404, detail="Block not found")

            if command.type is not None:
                block.type = command.type
            if command.content is not None:
                block.content = command.content
            if command.parent_id is not None:
                block.parent_id = UUID(command.parent_id)
            if command.properties is not None:
                block.properties = command.properties
            if command.order is not None:
                block.order = command.order

            self.db.commit()
            self.db.refresh(block)
            return block
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating block: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update block")

    def delete_block(self, command: BlockDeleteCommand) -> bool:
        try:
            block = self.db.query(Block).filter(
                Block.block_id == UUID(command.block_id),
                Block.page_id == UUID(command.page_id)
            ).first()
            if not block:
                raise HTTPException(status_code=404, detail="Block not found")

            self.db.delete(block)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting block: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete block")

    def __del__(self):
        self.db.close() 