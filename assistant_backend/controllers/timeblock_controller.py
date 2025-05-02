from fastapi import APIRouter, Depends, HTTPException
from typing import List
from adapters.storage.postgresql_adapter import PostgreSQLAdapter
from dto.task_dto import TimeBlockDto
from commands.task_cmd import TimeBlockCommand, TimeBlockUpdateCommand
from authorization.auth import get_auth_details


router = APIRouter()
storage = PostgreSQLAdapter()

@router.post("/timeblocks", response_model=TimeBlockDto)
async def create_time_block(
    time_block: TimeBlockCommand,
    current_user: dict = Depends(get_auth_details),
):
    try:
        time_block_data = time_block.dict()
        time_block_data['user_id'] = current_user['user_id']
        result = storage.create_time_block(time_block_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/timeblocks", response_model=List[TimeBlockDto])
async def get_time_blocks(
    workspace_id: str,
    current_user: dict = Depends(get_auth_details)
):
    try:
        time_blocks = storage.get_time_blocks(workspace_id, current_user['user_id'])
        return time_blocks
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/timeblocks/{time_block_id}", response_model=TimeBlockDto)
async def update_time_block(
    time_block_id: str,
    time_block: TimeBlockUpdateCommand,
    current_user: dict = Depends(get_auth_details)
):
    try:
        time_block_data = time_block.dict(exclude_unset=True)
        result = storage.update_time_block(time_block_id, time_block_data)
        if not result:
            raise HTTPException(status_code=404, detail="Time block not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/timeblocks/{time_block_id}")
async def delete_time_block(
    time_block_id: str,
    current_user: dict = Depends(get_auth_details)
):
    try:
        success = storage.delete_time_block(time_block_id)
        if not success:
            raise HTTPException(status_code=404, detail="Time block not found")
        return {"message": "Time block deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 