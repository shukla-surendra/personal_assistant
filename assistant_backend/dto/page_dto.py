from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class BlockDto(BaseModel):
    block_id: str
    page_id: str
    type: str
    content: Optional[Dict[str, Any]] = None
    properties: Optional[Dict[str, Any]] = None
    order: Optional[int] = None

class PageDto(BaseModel):
    page_id: str
    workspace_id: str
    title: str
    parent_page_id: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class PageDtoMapper:
    @staticmethod
    def map_to_page_dto(page) -> PageDto:
        # Deliberately no `blocks` field here -- populating it means lazy-
        # loading page.blocks, which can run after the handler's temporary
        # session has already closed (PageHandler() has no name binding in
        # `PageHandler().create_page(...)`, so CPython can __del__ -> close
        # the session before this mapper runs). Blocks are always fetched
        # through their own endpoint (GET .../pages/{id}/blocks) instead --
        # same reasoning BoardDto dropped its analogous `items` field for.
        return PageDto(
            page_id=str(page.page_id),
            workspace_id=str(page.workspace_id),
            title=page.title,
            parent_page_id=str(page.parent_page_id) if page.parent_page_id else None,
            properties=page.properties
        )

class BlockDtoMapper:
    @staticmethod
    def map_to_block_dto(block) -> BlockDto:
        return BlockDto(
            block_id=str(block.block_id),
            page_id=str(block.page_id),
            type=block.type,
            content=block.content,
            properties=block.properties,
            order=block.order
        )

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
