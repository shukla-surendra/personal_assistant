from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class BlockDto(BaseModel):
    block_id: str
    page_id: str
    type: str
    content: Optional[str] = None
    parent_id: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    order: Optional[int] = None

class PageDto(BaseModel):
    page_id: str
    workspace_id: str
    title: str
    content: Optional[str] = None
    parent_id: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    is_template: bool = False
    is_public: bool = False
    blocks: Optional[List[BlockDto]] = None

class PageDtoMapper:
    @staticmethod
    def map_to_page_dto(page) -> PageDto:
        return PageDto(
            page_id=str(page.page_id),
            workspace_id=str(page.workspace_id),
            title=page.title,
            content=page.content,
            parent_id=str(page.parent_id) if page.parent_id else None,
            icon=page.icon,
            cover=page.cover,
            properties=page.properties,
            is_template=page.is_template,
            is_public=page.is_public,
            blocks=[BlockDtoMapper.map_to_block_dto(block) for block in page.blocks] if page.blocks else None
        )

class BlockDtoMapper:
    @staticmethod
    def map_to_block_dto(block) -> BlockDto:
        return BlockDto(
            block_id=str(block.block_id),
            page_id=str(block.page_id),
            type=block.type,
            content=block.content,
            parent_id=str(block.parent_id) if block.parent_id else None,
            properties=block.properties,
            order=block.order
        )

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None 