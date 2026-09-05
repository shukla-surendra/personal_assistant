from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from authorization.auth import get_auth_details
from handlers.page_handler import PageHandler
from handlers.workspace_handlers import WorkspaceHandler
from commands.page_cmd import PageCommand, PageUpdateCommand, PageDeleteCommand, BlockCommand, BlockUpdateCommand, BlockDeleteCommand
from dto.page_dto import PageDto, BlockDto
from dto.page_dto import PageDtoMapper, BlockDtoMapper
from config import logger

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/pages", tags=["pages"])

page_router = router


def _verify_workspace_access(workspace_id: str, user_id: str):
    """Same gate board_controller.py uses -- pages live under a workspace,
    so they need the same membership check, not a bespoke one."""
    WorkspaceHandler().get_workspace(workspace_id, user_id)


@router.post("/", response_model=PageDto, status_code=status.HTTP_201_CREATED)
async def create_page(workspace_id: str, command: PageCommand, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    command.workspace_id = workspace_id
    try:
        page = PageHandler().create_page(command)
        return PageDtoMapper.map_to_page_dto(page)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{page_id}", response_model=PageDto)
async def update_page(workspace_id: str, page_id: str, command: PageUpdateCommand, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    command.page_id = page_id
    try:
        page = PageHandler().update_page(command)
        return PageDtoMapper.map_to_page_dto(page)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(workspace_id: str, page_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        command = PageDeleteCommand(page_id=page_id, workspace_id=workspace_id)
        PageHandler().delete_page(command)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{page_id}", response_model=PageDto)
async def get_page(workspace_id: str, page_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        page = PageHandler().get_page(page_id)
        if str(page.workspace_id) != str(workspace_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
        return PageDtoMapper.map_to_page_dto(page)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[PageDto])
async def list_pages(workspace_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        pages = PageHandler().list_pages(workspace_id)
        return [PageDtoMapper.map_to_page_dto(page) for page in pages]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing pages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Block endpoints
@router.post("/{page_id}/blocks", response_model=BlockDto, status_code=status.HTTP_201_CREATED)
async def create_block(workspace_id: str, page_id: str, command: BlockCommand, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    command.page_id = page_id
    try:
        block = PageHandler().create_block(command)
        return BlockDtoMapper.map_to_block_dto(block)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating block: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{page_id}/blocks/{block_id}", response_model=BlockDto)
async def update_block(workspace_id: str, page_id: str, block_id: str, command: BlockUpdateCommand, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    command.block_id = block_id
    try:
        block = PageHandler().update_block(command)
        return BlockDtoMapper.map_to_block_dto(block)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating block: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{page_id}/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(workspace_id: str, page_id: str, block_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        command = BlockDeleteCommand(block_id=block_id, page_id=page_id)
        PageHandler().delete_block(command)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting block: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{page_id}/blocks", response_model=List[BlockDto])
async def list_blocks(workspace_id: str, page_id: str, user: dict = Depends(get_auth_details)):
    _verify_workspace_access(workspace_id, user.get("user_id"))
    try:
        blocks = PageHandler().list_blocks(page_id)
        return [BlockDtoMapper.map_to_block_dto(block) for block in blocks]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing blocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))
