from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime
from commands.assistant_cmd import (
    AssistantCommand,
    TaskCommand,
    ReminderCommand,
    CalendarCommand,
    WorkspaceCommand,
    SearchCommand
)
from models.task import Task
from models.reminder import Reminder
from models.calendar import CalendarEvent
from models.workspace import Workspace
from database.connection import get_db
from config import logger

class AssistantHandler:
    """Handler for processing and executing assistant commands."""

    def __init__(self):
        self.db: Session = next(get_db())
        self.command_handlers = {
            "task": self._handle_task_command,
            "reminder": self._handle_reminder_command,
            "calendar": self._handle_calendar_command,
            "workspace": self._handle_workspace_command,
            "search": self._handle_search_command,
        }

    async def process_command(self, command: AssistantCommand) -> Dict[str, Any]:
        """Process a command and return the response."""
        try:
            # Determine command type and call appropriate handler
            command_type = self._determine_command_type(command.command)
            if command_type in self.command_handlers:
                return await self.command_handlers[command_type](command)
            else:
                return {
                    "message": "I'm not sure how to help with that. Try asking for 'help'.",
                    "data": {}
                }
        except Exception as e:
            logger.error(f"Error processing command: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

    def _determine_command_type(self, command: str) -> str:
        """Determine the type of command from the natural language input."""
        command = command.lower()
        if any(word in command for word in ["task", "todo", "complete"]):
            return "task"
        elif any(word in command for word in ["remind", "reminder"]):
            return "reminder"
        elif any(word in command for word in ["calendar", "schedule", "event"]):
            return "calendar"
        elif any(word in command for word in ["workspace", "project"]):
            return "workspace"
        elif any(word in command for word in ["search", "find"]):
            return "search"
        return "unknown"

    async def _handle_task_command(self, command: TaskCommand) -> Dict[str, Any]:
        """Handle task-related commands."""
        if command.action == "create":
            task = Task(
                title=command.title,
                description=command.description,
                due_date=command.due_date,
                priority=command.priority,
                user_id=command.user_id
            )
            self.db.add(task)
            self.db.commit()
            return {
                "message": f"Created task: {task.title}",
                "data": {"task_id": str(task.id)}
            }
        
        elif command.action == "list":
            tasks = self.db.query(Task).filter(
                Task.user_id == command.user_id
            ).all()
            return {
                "message": "Here are your tasks:",
                "data": {
                    "tasks": [
                        {
                            "id": str(t.id),
                            "title": t.title,
                            "status": t.status,
                            "due_date": t.due_date
                        } for t in tasks
                    ]
                }
            }
        
        elif command.action == "complete":
            task = self.db.query(Task).filter(
                Task.id == command.task_id,
                Task.user_id == command.user_id
            ).first()
            if task:
                task.status = "DONE"
                self.db.commit()
                return {
                    "message": f"Completed task: {task.title}",
                    "data": {"task_id": str(task.id)}
                }
            return {"message": "Task not found", "data": {}}

    async def _handle_reminder_command(self, command: ReminderCommand) -> Dict[str, Any]:
        """Handle reminder-related commands."""
        if command.action == "create":
            reminder = Reminder(
                message=command.message,
                remind_at=command.remind_at,
                user_id=command.user_id
            )
            self.db.add(reminder)
            self.db.commit()
            return {
                "message": f"Set reminder: {reminder.message}",
                "data": {"reminder_id": str(reminder.id)}
            }
        
        elif command.action == "list":
            reminders = self.db.query(Reminder).filter(
                Reminder.user_id == command.user_id
            ).all()
            return {
                "message": "Here are your reminders:",
                "data": {
                    "reminders": [
                        {
                            "id": str(r.id),
                            "message": r.message,
                            "remind_at": r.remind_at
                        } for r in reminders
                    ]
                }
            }

    async def _handle_calendar_command(self, command: CalendarCommand) -> Dict[str, Any]:
        """Handle calendar-related commands."""
        # TODO: Implement calendar command handling
        return {"message": "Calendar functionality coming soon", "data": {}}

    async def _handle_workspace_command(self, command: WorkspaceCommand) -> Dict[str, Any]:
        """Handle workspace-related commands."""
        # TODO: Implement workspace command handling
        return {"message": "Workspace functionality coming soon", "data": {}}

    async def _handle_search_command(self, command: SearchCommand) -> Dict[str, Any]:
        """Handle search-related commands."""
        # TODO: Implement search across all relevant models
        return {
            "message": f"Search results for: {command.query}",
            "data": {"query": command.query}
        } 