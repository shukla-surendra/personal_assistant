from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from handlers.page_handler import PageHandler
from commands.page_cmd import PageCommand, PageUpdateCommand, PageDeleteCommand, BlockCommand, BlockUpdateCommand, BlockDeleteCommand
from adapters.orm.models.pg_models import Page, Block
from dto.page_dto import PageDto, BlockDto
from dto.page_dto import PageDtoMapper, BlockDtoMapper

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/pages", tags=["pages"])

@router.post("/", response_model=PageDto, status_code=status.HTTP_201_CREATED)
async def create_page(command: PageCommand):
    handler = PageHandler()
    try:
        page = handler.create_page(command)
        return PageDtoMapper.map_to_page_dto(page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{page_id}", response_model=PageDto)
async def update_page(page_id: str, command: PageUpdateCommand):
    handler = PageHandler()
    try:
        command.page_id = page_id
        page = handler.update_page(command)
        return PageDtoMapper.map_to_page_dto(page)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(page_id: str, workspace_id: str):
    handler = PageHandler()
    try:
        command = PageDeleteCommand(page_id=page_id, workspace_id=workspace_id)
        handler.delete_page(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{page_id}", response_model=PageDto)
async def get_page(page_id: str):
    handler = PageHandler()
    try:
        page = handler.get_page(page_id)
        return PageDtoMapper.map_to_page_dto(page)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[PageDto])
async def list_pages(workspace_id: str):
    handler = PageHandler()
    try:
        pages = handler.list_pages(workspace_id)
        return [PageDtoMapper.map_to_page_dto(page) for page in pages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Block endpoints
@router.post("/{page_id}/blocks", response_model=BlockDto, status_code=status.HTTP_201_CREATED)
async def create_block(page_id: str, command: BlockCommand):
    handler = PageHandler()
    try:
        command.page_id = page_id
        block = handler.create_block(command)
        return BlockDtoMapper.map_to_block_dto(block)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{page_id}/blocks/{block_id}", response_model=BlockDto)
async def update_block(page_id: str, block_id: str, command: BlockUpdateCommand):
    handler = PageHandler()
    try:
        command.block_id = block_id
        block = handler.update_block(command)
        return BlockDtoMapper.map_to_block_dto(block)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{page_id}/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(page_id: str, block_id: str):
    handler = PageHandler()
    try:
        command = BlockDeleteCommand(block_id=block_id, page_id=page_id)
        handler.delete_block(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{page_id}/blocks", response_model=List[BlockDto])
async def list_blocks(page_id: str):
    handler = PageHandler()
    try:
        blocks = handler.list_blocks(page_id)
        return [BlockDtoMapper.map_to_block_dto(block) for block in blocks]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 