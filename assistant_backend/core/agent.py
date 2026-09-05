import json
from datetime import datetime, timedelta
from typing import Any, Dict

from openai import OpenAI

from config import settings, logger
from commands.task_cmd import TaskCommand
from commands.reminder_cmd import ReminderCommand
from handlers.task_handler import TaskHandler
from handlers.reminder_handler import ReminderHandler


class Agent:
    """Natural-language command processor for the /assistant/command
    endpoint. Uses the same OpenAI chat-completion pattern as
    ChatHandler.create_completion, not a local Llama-2 model -- the
    original approach needed torch/transformers (not installed), a real
    GPU (not available), and a gated HuggingFace model (no access token
    configured), so it was undeployable by construction, not just slow.
    Executes against the REAL TaskHandler/ReminderHandler (real
    workspace-scoped models) -- the previous implementation imported a
    dead models.task/models.reminder module tree with no user_id/workspace_id
    scoping, and its own ContextManager dependency was an empty stub class
    that would have raised AttributeError on first use regardless of the
    LLM backend.
    """

    def __init__(self, user_id: str, workspace_id: str):
        self.user_id = user_id
        self.workspace_id = workspace_id

    def _build_prompt(self, command: str) -> str:
        return f"""You are a productivity assistant. Read the user's request and \
respond with ONLY a JSON object (no other text, no markdown fences) in exactly \
this shape:

{{
  "intent": "task" | "reminder" | "search" | "unknown",
  "action": "create" | "list",
  "entities": {{
    "title": string or null,
    "description": string or null,
    "due_date": ISO 8601 datetime string or null,
    "priority": "high" | "medium" | "low" or null,
    "query": string or null
  }}
}}

Rules:
- "remind me to X" or "set a reminder..." -> intent "reminder".
- "add a task..." / "create a task..." -> intent "task".
- "show/list my tasks|reminders" -> action "list" with the matching intent.
- If you can't confidently classify the request, use intent "unknown".
- due_date: resolve relative dates (e.g. "tomorrow", "next Monday") against \
the current time: {datetime.utcnow().isoformat()}Z (UTC).

User request: {command}"""

    def process_command(self, command: str) -> Dict[str, Any]:
        if not settings.OPENAI_API_KEY:
            return {
                "message": "The assistant isn't configured yet -- no OPENAI_API_KEY is set on the backend.",
                "data": {},
            }

        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": self._build_prompt(command)}],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            parsed = json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Assistant: failed to interpret command '{command}': {e}")
            return {
                "message": "I'm having trouble understanding that. Could you rephrase?",
                "data": {},
            }

        return self._execute(parsed)

    def _execute(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        intent = parsed.get("intent")
        action = parsed.get("action")
        entities = parsed.get("entities") or {}

        if intent == "task":
            return self._handle_task(action, entities)
        if intent == "reminder":
            return self._handle_reminder(action, entities)
        if intent == "search":
            query = entities.get("query") or ""
            return {"message": f"Search isn't wired up yet -- you asked about: {query}", "data": {"query": query}}

        return {
            "message": "I'm not sure how to help with that yet -- try asking me to create or list a task or a reminder.",
            "data": {},
        }

    def _handle_task(self, action: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        if action == "create":
            cmd = TaskCommand(
                workspace_id=self.workspace_id,
                user_id=self.user_id,
                title=entities.get("title") or "Untitled task",
                description=entities.get("description"),
                priority=entities.get("priority") or "medium",
            )
            task = TaskHandler().create_task(cmd)
            return {
                "message": f"Created task: {task.title}",
                "data": {"task_id": str(task.task_id)},
            }

        if action == "list":
            tasks = TaskHandler().list_tasks(
                user_id=self.user_id, workspace_id=self.workspace_id, limit=10
            )
            return {
                "message": "Here are your tasks:",
                "data": {
                    "tasks": [
                        {"id": str(t.task_id), "title": t.title, "status": t.status}
                        for t in tasks
                    ]
                },
            }

        return {"message": "I can create or list tasks -- try one of those.", "data": {}}

    def _handle_reminder(self, action: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        if action == "create":
            due_date = entities.get("due_date")
            cmd = ReminderCommand(
                workspace_id=self.workspace_id,
                user_id=self.user_id,
                title=entities.get("title") or entities.get("description") or "Reminder",
                due_date=due_date or (datetime.utcnow() + timedelta(hours=1)),
            )
            reminder = ReminderHandler().create_reminder(cmd)
            return {
                "message": f"Set a reminder: {reminder.title}",
                "data": {"reminder_id": str(reminder.reminder_id)},
            }

        if action == "list":
            reminders = ReminderHandler().list_reminders(
                workspace_id=self.workspace_id, user_id=self.user_id
            )
            return {
                "message": "Here are your reminders:",
                "data": {
                    "reminders": [
                        {"id": str(r.reminder_id), "title": r.title}
                        for r in reminders
                    ]
                },
            }

        return {"message": "I can create or list reminders -- try one of those.", "data": {}}
