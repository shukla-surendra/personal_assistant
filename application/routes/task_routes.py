from fastapi import APIRouter, HTTPException, status, Depends
from application.handlers.task_handler import TaskHandler
from application.commands.task_cmd import TaskCommand, TaskDeleteCommand, TaskUpdateCommand
from application.common.auth import get_auth_details
from config import logger

router = APIRouter()

# Initialize handler
task_handler = TaskHandler()

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    task_cmd: TaskCommand,
    user: dict = Depends(get_auth_details)
):
    """Create a new task"""
    try:
        task_cmd.user_id = user.get("user_id")
        return task_handler.create_task(task_cmd)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail="Failed to create task")

@router.get("", status_code=status.HTTP_200_OK)
async def list_tasks(
    user: dict = Depends(get_auth_details),
    task_status: str = None,
    order: str = 'desc',
    task_type: str = 'todo',
    skip: int = 0,
    page_size: int = 50,
    priority: int = None
):
    """List tasks with filtering and pagination"""
    try:
        user_id = user.get("user_id")
        return task_handler.list_tasks(
            user_id=user_id,
            skip=skip,
            limit=page_size,
            task_status=task_status,
            task_type=task_type,
            order=order,
            priority=priority
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error listing tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to list tasks")

@router.get("/{task_id}", status_code=status.HTTP_200_OK)
async def get_task(
    task_id: str,
    user: dict = Depends(get_auth_details)
):
    """Get a single task by ID"""
    try:
        user_id = user.get("user_id")
        return task_handler.get_task(
            task_id=task_id,
            user_id=user_id
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting task: {e}")
        raise HTTPException(status_code=500, detail="Failed to get task")

@router.put("/{task_id}", status_code=status.HTTP_200_OK)
async def update_task(
    task_id: str,
    task_cmd: TaskUpdateCommand,
    user: dict = Depends(get_auth_details)
):
    """Update an existing task"""
    try:
        task_cmd.task_id = task_id
        task_cmd.user_id = user.get("user_id")
        return task_handler.update_task(task_cmd)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        raise HTTPException(status_code=500, detail="Failed to update task")

@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: str,
    user: dict = Depends(get_auth_details)
):
    """Soft delete a task"""
    try:
        task_cmd = TaskDeleteCommand(
            task_id=task_id,
            user_id=user.get("user_id")
        )
        task_handler.delete_task(task_cmd)
        return {"message": "Task deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete task") 