from uuid import UUID
from adapters.orm.models.pg_models import Page, Block
from adapters.orm.models.database import SessionLocal
from commands.page_cmd import PageCommand, PageUpdateCommand, PageDeleteCommand, BlockCommand, BlockUpdateCommand, BlockDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
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
                parent_page_id=UUID(command.parent_page_id) if command.parent_page_id else None,
                properties=command.properties
            )
            self.db.add(page)
            self.db.commit()
            self.db.refresh(page)
            return page
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating page: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create page")

    def get_page(self, page_id: str) -> Page:
        try:
            page = self.db.query(Page).filter(
                Page.page_id == UUID(page_id),
                Page.is_deleted == False
            ).first()
            if not page:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
            return page
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            logger.error(f"Error getting page: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to get page")

    def list_pages(self, workspace_id: str) -> list[Page]:
        try:
            return self.db.query(Page).filter(
                Page.workspace_id == UUID(workspace_id),
                Page.is_deleted == False
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing pages: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list pages")

    def update_page(self, command: PageUpdateCommand) -> Page:
        try:
            page = self.get_page(command.page_id)

            if command.title is not None:
                page.title = command.title
            if command.parent_page_id is not None:
                page.parent_page_id = UUID(command.parent_page_id) if command.parent_page_id else None
            if command.properties is not None:
                page.properties = command.properties

            self.db.commit()
            self.db.refresh(page)
            return page
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating page: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update page")

    def delete_page(self, command: PageDeleteCommand) -> bool:
        try:
            page = self.db.query(Page).filter(
                Page.page_id == UUID(command.page_id),
                Page.workspace_id == UUID(command.workspace_id),
                Page.is_deleted == False
            ).first()
            if not page:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

            # Soft delete -- same pattern Task/Board use. The FK's ON DELETE
            # SET NULL never fires for a soft delete (no real DELETE
            # happens), so child pages are promoted to top-level explicitly
            # here -- same "unlink don't cascade" rule Company/Epic/Sprint
            # deletion already follows, rather than leaving them nested
            # under a page that no longer shows up anywhere.
            self.db.query(Page).filter(Page.parent_page_id == page.page_id).update({"parent_page_id": None})
            page.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
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
            block = self.db.query(Block).filter(
                Block.block_id == UUID(command.block_id),
                Block.is_deleted == False
            ).first()
            if not block:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

            if command.type is not None:
                block.type = command.type
            if command.content is not None:
                block.content = command.content
            if command.properties is not None:
                block.properties = command.properties
            if command.order is not None:
                block.order = command.order

            self.db.commit()
            self.db.refresh(block)
            return block
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating block: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update block")

    def delete_block(self, command: BlockDeleteCommand) -> bool:
        try:
            block = self.db.query(Block).filter(
                Block.block_id == UUID(command.block_id),
                Block.page_id == UUID(command.page_id),
                Block.is_deleted == False
            ).first()
            if not block:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

            block.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting block: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete block")

    def list_blocks(self, page_id: str) -> list[Block]:
        try:
            return self.db.query(Block).filter(
                Block.page_id == UUID(page_id),
                Block.is_deleted == False
            ).order_by(Block.order.asc().nulls_last(), Block.created_at.asc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing blocks: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list blocks")

    def __del__(self):
        self.db.close()
