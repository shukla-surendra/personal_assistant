from datetime import datetime
from application.commands.task_cmd import TaskCommand, TaskDeleteCommand, TaskUpdateCommand
from starlette import status
from fastapi import HTTPException
from constants import TaskType, TaskPriority, TaskStatus
from models import Task
from application.dto.task_dto import TaskDtoMapper
from config import logger
from sqlalchemy.orm import Session
from database import get_db
import traceback

class TaskHandler:
    def __init__(self):
        self.db = next(get_db())

    def create_task(self, task_cmd: TaskCommand):
        """Create a new task in PostgreSQL"""
        try:
            # Convert priority string to appropriate format based on storage type
            priority_map = {
                'low': {'pg': 1, 'dynamo': 'low'},
                'medium': {'pg': 2, 'dynamo': 'medium'},
                'high': {'pg': 3, 'dynamo': 'high'}
            }
            
            # Get the appropriate priority value based on storage type
            priority_value = priority_map.get(task_cmd.priority.lower(), priority_map['medium'])
            priority = priority_value['pg']  # Use integer for PostgreSQL

            # Convert task_type and status strings to enum values
            task_type = TaskType.TODO
            if task_cmd.task_type:
                try:
                    task_type = TaskType(task_cmd.task_type.lower())
                except ValueError:
                    logger.warning(f"Invalid task type: {task_cmd.task_type}. Defaulting to TODO")

            status = TaskStatus.TODO
            if task_cmd.status:
                try:
                    status = TaskStatus(task_cmd.status.lower())
                except ValueError:
                    logger.warning(f"Invalid status: {task_cmd.status}. Defaulting to TODO")

            # Create task with proper enum values
            task = Task(
                workspace_id=task_cmd.workspace_id,
                user_id=task_cmd.user_id,
                title=task_cmd.title,
                description=task_cmd.description,
                priority=priority,  # Use integer value for PostgreSQL
                task_type=task_type,
                status=status,
                start_time=task_cmd.start_time,
                end_time=task_cmd.end_time
            )

            self.db.add(task)
            self.db.commit()
            self.db.refresh(task)
            return TaskDtoMapper.map_to_task_dto_mapper(task)
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating task: {e}")
            raise HTTPException(status_code=500, detail="Failed to create task")

    def delete_task(self, task_cmd: TaskDeleteCommand):
        """Soft delete a task in PostgreSQL"""
        try:
            task = self.db.query(Task).filter(
                Task.task_id == task_cmd.task_id,
                Task.user_id == task_cmd.user_id,
                Task.is_deleted == False
            ).first()

            if not task:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

            task.is_deleted = True
            task.updated_at = datetime.utcnow()
            self.db.commit()
            return TaskDtoMapper.map_to_task_dto_mapper(task)
        except HTTPException as he:
            self.db.rollback()
            raise he
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting task: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete task")

    def update_task(self, task_cmd: TaskUpdateCommand):
        """Update an existing task in PostgreSQL"""
        try:
            logger.info(f"Starting task update for task_id: {task_cmd.task_id}, user_id: {task_cmd.user_id}")
            
            task = self.db.query(Task).filter(
                Task.task_id == task_cmd.task_id,
                Task.user_id == task_cmd.user_id,
                Task.is_deleted == False
            ).first()

            if not task:
                logger.error(f"Task not found - task_id: {task_cmd.task_id}, user_id: {task_cmd.user_id}")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

            logger.info(f"Found existing task: {task.task_id}")
            logger.info(f"Current task state: {task.__dict__}")
            logger.info(f"Update command data: {task_cmd.dict(exclude_none=True)}")

            # Update fields if provided
            if task_cmd.title is not None:
                logger.info(f"Updating title from '{task.title}' to '{task_cmd.title}'")
                task.title = task_cmd.title
            if task_cmd.description is not None:
                logger.info(f"Updating description")
                task.description = task_cmd.description
            if task_cmd.priority is not None:
                priority_map = {
                    'low': 1,
                    'medium': 2,
                    'high': 3
                }
                new_priority = priority_map.get(task_cmd.priority.lower(), 2)
                logger.info(f"Updating priority from {task.priority} to {new_priority}")
                task.priority = new_priority
            if task_cmd.status is not None:
                try:
                    new_status = TaskStatus(task_cmd.status.lower())
                    logger.info(f"Updating status from {task.status} to {new_status}")
                    task.status = new_status
                except ValueError:
                    logger.warning(f"Invalid status: {task_cmd.status}. Keeping existing status")
            if task_cmd.completed is not None:
                logger.info(f"Updating completed from {task.completed} to {task_cmd.completed}")
                task.completed = task_cmd.completed
            if task_cmd.published is not None:
                logger.info(f"Updating published from {task.published} to {task_cmd.published}")
                task.published = task_cmd.published
            if task_cmd.task_type is not None:
                try:
                    new_task_type = TaskType(task_cmd.task_type.lower())
                    logger.info(f"Updating task_type from {task.task_type} to {new_task_type}")
                    task.task_type = new_task_type
                except ValueError:
                    logger.warning(f"Invalid task type: {task_cmd.task_type}. Keeping existing task type")
            if task_cmd.due_on is not None:
                logger.info(f"Updating due_on from {task.due_on} to {task_cmd.due_on}")
                task.due_on = task_cmd.due_on
            if task_cmd.start_time is not None:
                logger.info(f"Updating start_time from {task.start_time} to {task_cmd.start_time}")
                task.start_time = task_cmd.start_time
            if task_cmd.end_time is not None:
                logger.info(f"Updating end_time from {task.end_time} to {task_cmd.end_time}")
                task.end_time = task_cmd.end_time
            if task_cmd.is_deleted is not None:
                logger.info(f"Updating is_deleted from {task.is_deleted} to {task_cmd.is_deleted}")
                task.is_deleted = task_cmd.is_deleted

            task.updated_at = datetime.utcnow()
            logger.info("Committing changes to database")
            self.db.commit()
            self.db.refresh(task)
            logger.info(f"Successfully updated task: {task.task_id}")
            return TaskDtoMapper.map_to_task_dto_mapper(task)

        except HTTPException as he:
            self.db.rollback()
            logger.error(f"HTTP Exception during task update: {str(he)}")
            raise he
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating task: {str(e)}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail="Failed to update task")

    def list_tasks(self, user_id: str, workspace_id: str = None, skip: int = 0, limit: int = 10, 
                   task_status=None, task_type='todo', order='desc', priority=None):
        """List tasks with filtering and pagination"""
        try:
            query = self.db.query(Task).filter(
                Task.user_id == user_id,
                Task.is_deleted == False
            )

            if workspace_id:
                query = query.filter(Task.workspace_id == workspace_id)
            if task_status:
                query = query.filter(Task.status == task_status)
            if task_type:
                query = query.filter(Task.task_type == task_type)
            if priority:
                query = query.filter(Task.priority == priority)

            # Apply ordering
            if order == 'desc':
                query = query.order_by(Task.created_at.desc())
            else:
                query = query.order_by(Task.created_at.asc())

            # Apply pagination
            tasks = query.offset(skip).limit(limit).all()
            return [TaskDtoMapper.map_to_task_dto_mapper(task) for task in tasks]

        except Exception as e:
            logger.error(f"Error listing tasks: {e}")
            raise HTTPException(status_code=500, detail="Failed to list tasks")

    def get_task(self, task_id: str, user_id: str):
        """Get a single task by ID"""
        try:
            task = self.db.query(Task).filter(
                Task.task_id == task_id,
                Task.user_id == user_id,
                Task.is_deleted == False
            ).first()

            if not task:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

            return TaskDtoMapper.map_to_task_dto_mapper(task)

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error getting task: {e}")
            raise HTTPException(status_code=500, detail="Failed to get task")

    def get_task_by_slug(self, slug: str, user_id: str):
        """ Get a single task by slug """
        try:
            # Scan for task with matching slug
            tasks = self.db.query(Task).filter(
                Task.slug == slug,
                Task.user_id == user_id,
                Task.is_deleted == False
            ).all()

            if not tasks or len(tasks) == 0:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

            return TaskDtoMapper.map_to_task_dto_mapper(tasks[0])

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error getting task by slug: {e}")
            raise HTTPException(status_code=500, detail="Failed to get task")
