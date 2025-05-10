from datetime import datetime
from commands.task_cmd import TaskCommand, TaskDeleteCommand, TaskUpdateCommand
from fastapi import HTTPException, status
from constants import TaskType, TaskStatus
from adapters.orm.models.pg_models import Task
from dto.task_dto import TaskDtoMapper
from config import logger
from adapters.orm.models.database import get_db
import traceback
import re
import uuid


class TaskHandler:
    def __init__(self):
        self.db = next(get_db())
        logger.info("TaskHandler initialized")

    def _generate_slug(self, title: str) -> str:
        """Generate a URL-friendly slug from the title"""
        logger.debug(f"Generating slug for title: {title}")
        # Convert to lowercase and replace spaces with hyphens
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug).strip('-')
        
        # Check if slug exists
        base_slug = slug
        counter = 1
        while self.db.query(Task).filter(Task.slug == slug).first():
            logger.debug(f"Slug {slug} exists, trying with counter {counter}")
            slug = f"{base_slug}-{counter}"
            counter += 1
            
        logger.debug(f"Generated final slug: {slug}")
        return slug

    def create_task(self, task_cmd: TaskCommand):
        """Create a new task in PostgreSQL"""
        try:
            logger.info(f"Creating new task with command: {task_cmd}")
            # Get the appropriate priority value based on storage type
            priority = task_cmd.priority.lower()
            
            # Convert task_type and status strings to enum values
            task_type = TaskType.TODO
            if task_cmd.task_type:
                try:
                    task_type = TaskType(task_cmd.task_type.lower())
                except ValueError:
                    logger.warning(f"Invalid task type: {task_cmd.task_type}. Defaulting to TODO")
                    task_type = TaskType.TODO

            task_status = TaskStatus.TODO
            if task_cmd.status:
                try:
                    task_status = TaskStatus(task_cmd.status.lower())
                except ValueError:
                    logger.warning(f"Invalid status: {task_cmd.status}. Defaulting to TODO")
                    task_status = TaskStatus.TODO

            # Generate slug if not provided
            slug = task_cmd.slug or self._generate_slug(task_cmd.title)
            logger.debug(f"Using slug: {slug}")

            # Generate task_id if not provided
            task_id = task_cmd.task_id or str(uuid.uuid4())
            logger.debug(f"Using task_id: {task_id}")

            # Create task with enum values converted to strings
            task = Task(
                task_id=task_id,
                workspace_id=task_cmd.workspace_id,
                board_id=task_cmd.board_id,
                user_id=task_cmd.user_id,
                title=task_cmd.title,
                description=task_cmd.description,
                priority=priority,
                task_type=task_type.value,  # Convert enum to string value
                status=task_status.value,  # Convert enum to string value
                completed=task_cmd.completed,
                is_deleted=task_cmd.is_deleted,
                due_on=task_cmd.due_on,
                start_time=task_cmd.start_time,
                end_time=task_cmd.end_time,
                assignee_id=task_cmd.assignee_id,
                reporter_id=task_cmd.reporter_id,
                watchers=task_cmd.watchers,
                labels=task_cmd.labels,
                meta_data=task_cmd.meta_data,
                settings=task_cmd.settings,
                public_access=task_cmd.public_access,
                slug=slug
            )

            logger.debug(f"Created task object: {task}")
            self.db.add(task)
            self.db.commit()
            logger.info(f"Successfully created task with ID: {task.task_id}")
            return TaskDtoMapper.map_to_task_dto_mapper(task)

        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            logger.error(traceback.format_exc())
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating task: {str(e)}"
            )

    def delete_task(self, task_cmd: TaskDeleteCommand):
        """Delete a task"""
        try:
            logger.info(f"Deleting task with command: {task_cmd}")
            task = self.db.query(Task).filter(
                Task.task_id == task_cmd.task_id,
                Task.workspace_id == task_cmd.workspace_id,
                Task.user_id == task_cmd.user_id
            ).first()

            if not task:
                logger.warning(f"Task not found for deletion: {task_cmd.task_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )

            task.is_deleted = True
            self.db.commit()
            logger.info(f"Successfully deleted task: {task_cmd.task_id}")
            return {"message": "Task deleted successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting task: {str(e)}")
            logger.error(traceback.format_exc())
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting task: {str(e)}"
            )

    def update_task(self, task_cmd: TaskUpdateCommand):
        """Update a task"""
        try:
            logger.info(f"Updating task with command: {task_cmd}")
            task = self.db.query(Task).filter(
                Task.task_id == task_cmd.task_id,
                Task.workspace_id == task_cmd.workspace_id,
                Task.user_id == task_cmd.user_id
            ).first()

            if not task:
                logger.warning(f"Task not found for update: {task_cmd.task_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )

            # Update fields if provided
            if task_cmd.title is not None:
                task.title = task_cmd.title
                task.slug = self._generate_slug(task_cmd.title)
            if task_cmd.description is not None:
                task.description = task_cmd.description
            if task_cmd.priority is not None:
                task.priority = task_cmd.priority.lower()
            if task_cmd.task_type is not None:
                try:
                    task.task_type = TaskType(task_cmd.task_type.lower()).value
                except ValueError:
                    logger.warning(f"Invalid task type: {task_cmd.task_type}. Keeping existing value")
            if task_cmd.status is not None:
                try:
                    task.status = TaskStatus(task_cmd.status.lower()).value
                except ValueError:
                    logger.warning(f"Invalid status: {task_cmd.status}. Keeping existing value")
            if task_cmd.completed is not None:
                task.completed = task_cmd.completed
            if task_cmd.due_on is not None:
                task.due_on = task_cmd.due_on
            if task_cmd.start_time is not None:
                task.start_time = task_cmd.start_time
            if task_cmd.end_time is not None:
                task.end_time = task_cmd.end_time
            if task_cmd.assignee_id is not None:
                task.assignee_id = task_cmd.assignee_id
            if task_cmd.reporter_id is not None:
                task.reporter_id = task_cmd.reporter_id
            if task_cmd.watchers is not None:
                task.watchers = task_cmd.watchers
            if task_cmd.labels is not None:
                task.labels = task_cmd.labels
            if task_cmd.meta_data is not None:
                task.meta_data = task_cmd.meta_data
            if task_cmd.settings is not None:
                task.settings = task_cmd.settings
            if task_cmd.public_access is not None:
                task.public_access = task_cmd.public_access

            self.db.commit()
            logger.info(f"Successfully updated task: {task_cmd.task_id}")
            return TaskDtoMapper.map_to_task_dto_mapper(task)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating task: {str(e)}")
            logger.error(traceback.format_exc())
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating task: {str(e)}"
            )

    def list_tasks(self, user_id: str, workspace_id: str = None, skip: int = 0, limit: int = 10, 
                   task_status=None, task_type='todo', order='desc', priority=None):
        """List tasks with optional filtering"""
        try:
            logger.info(f"Listing tasks for user {user_id} with filters: workspace_id={workspace_id}, "
                       f"task_status={task_status}, task_type={task_type}, order={order}, priority={priority}")
            
            query = self.db.query(Task).filter(
                Task.user_id == user_id,
                Task.is_deleted == False
            )

            if workspace_id:
                query = query.filter(Task.workspace_id == workspace_id)
            if task_status:
                try:
                    status_enum = TaskStatus(task_status.lower())
                    query = query.filter(Task.status == status_enum.value)
                except ValueError:
                    logger.warning(f"Invalid task status: {task_status}")
            if task_type:
                try:
                    type_enum = TaskType(task_type.lower())
                    query = query.filter(Task.task_type == type_enum.value)
                except ValueError:
                    logger.warning(f"Invalid task type: {task_type}")
            if priority:
                query = query.filter(Task.priority == priority.lower())

            # Apply ordering
            if order.lower() == 'desc':
                query = query.order_by(Task.created_at.desc())
            else:
                query = query.order_by(Task.created_at.asc())

            # Apply pagination
            tasks = query.offset(skip).limit(limit).all()
            logger.info(f"Found {len(tasks)} tasks matching criteria")
            return [TaskDtoMapper.map_to_task_dto_mapper(task) for task in tasks]

        except Exception as e:
            logger.error(f"Error listing tasks: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error listing tasks: {str(e)}"
            )

    def get_task(self, workspace_id: str, task_id: str, user_id: str):
        """Get a specific task"""
        try:
            logger.info(f"Getting task {task_id} for user {user_id} in workspace {workspace_id}")
            task = self.db.query(Task).filter(
                Task.task_id == task_id,
                Task.workspace_id == workspace_id,
                Task.user_id == user_id,
                Task.is_deleted == False
            ).first()

            if not task:
                logger.warning(f"Task not found: {task_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )

            logger.info(f"Successfully retrieved task: {task_id}")
            return TaskDtoMapper.map_to_task_dto_mapper(task)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting task: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error getting task: {str(e)}"
            )

    def get_task_by_slug(self, slug: str, user_id: str):
        """Get a task by its slug"""
        try:
            logger.info(f"Getting task with slug {slug} for user {user_id}")
            task = self.db.query(Task).filter(
                Task.slug == slug,
                Task.user_id == user_id,
                Task.is_deleted == False
            ).first()

            if not task:
                logger.warning(f"Task not found with slug: {slug}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )

            logger.info(f"Successfully retrieved task with slug: {slug}")
            return TaskDtoMapper.map_to_task_dto_mapper(task)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting task by slug: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error getting task by slug: {str(e)}"
            )

    def get_public_note(self, note_id: str):
        """Get a note with public access by ID - no authentication required"""
        try:
            logger.info(f"Getting public note: {note_id}")
            # Get the note from database without user_id check
            note = self.db.query(Task).filter(
                Task.task_id == note_id,
                Task.task_type == TaskType.NOTE.value,
                Task.public_access == True,
                Task.is_deleted == False
            ).first()

            if not note:
                logger.warning(f"Public note not found or not publicly accessible: {note_id}")
                return None

            logger.info(f"Successfully retrieved public note: {note_id}")
            return TaskDtoMapper.map_to_task_dto_mapper(note)

        except Exception as e:
            logger.error(f"Error getting public note: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get public note"
            )
