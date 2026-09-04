from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from config import logger
from models.task import Task
from models.reminder import Reminder
from models.calendar import CalendarEvent
from models.workspace import Workspace
from database.connection import get_db
from sqlalchemy.orm import Session
from .context_manager import ContextManager

class Agent:
    """Agent system using Llama 2 for command processing and execution."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.db: Session = next(get_db())
        self.context_manager = ContextManager(user_id)
        
        # Initialize Llama 2 -- imported here, not at module level, so the rest of the
        # app can boot without torch/transformers installed (they're a multi-GB
        # dependency this is the only feature that needs, and this feature needs a
        # gated HF model + real GPU to work at all -- neither available in this
        # deployment). Importing core.agent no longer requires torch; constructing
        # an Agent still does, and fails with a clear error if it's not installed.
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer

            self.tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-chat-hf")
            self.model = AutoModelForCausalLM.from_pretrained(
                "meta-llama/Llama-2-7b-chat-hf",
                torch_dtype=torch.float16,
                device_map="auto"
            )
        except Exception as e:
            logger.error(f"Error initializing Llama 2: {e}")
            raise

    def _create_prompt(self, command: str) -> str:
        """Create a prompt for Llama 2 with context and command."""
        # Get relevant context
        context = self.context_manager.get_formatted_context()
        
        # Get user preferences
        preferences = self.context_manager.user_preferences
        assistant_name = preferences["assistant_settings"]["name"]
        
        prompt = f"""You are {assistant_name}, a helpful AI assistant. Use the following context to help understand the user's request:

Previous interactions:
{context}

Current request: {command}

Please analyze the request and respond in the following JSON format:
{{
    "intent": "task|reminder|calendar|workspace|search|unknown",
    "action": "create|list|update|delete",
    "entities": {{
        "title": "string or null",
        "description": "string or null",
        "due_date": "ISO datetime or null",
        "priority": "HIGH|MEDIUM|LOW or null",
        "message": "string or null",
        "remind_at": "ISO datetime or null",
        "query": "string or null"
    }},
    "confidence": float between 0 and 1,
    "requires_clarification": boolean,
    "clarification_questions": ["string"] or null
}}

Consider the following when analyzing:
1. Use context from previous interactions to understand references
2. If the request is ambiguous, set requires_clarification to true and provide questions
3. Extract dates and times in ISO format
4. Maintain a helpful and professional tone
5. Consider user preferences and settings

Response:"""
        return prompt

    async def process_command(self, command: str) -> Dict[str, Any]:
        """Process a command using Llama 2 and execute appropriate action."""
        try:
            # Generate prompt and get Llama 2's response
            prompt = self._create_prompt(command)
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=512,
                    temperature=0.7,
                    top_p=0.9,
                    do_sample=True
                )
            
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract JSON from response
            try:
                json_str = response.split("Response:")[-1].strip()
                parsed_response = json.loads(json_str)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse Llama 2 response: {response}")
                return {
                    "message": "I'm having trouble understanding that. Could you rephrase?",
                    "data": {}
                }

            # Check if clarification is needed
            if parsed_response.get("requires_clarification", False):
                return {
                    "message": "I need some clarification:",
                    "data": {
                        "questions": parsed_response["clarification_questions"],
                        "requires_clarification": True
                    }
                }

            # Execute the command based on Llama 2's understanding
            result = await self._execute_command(parsed_response)
            
            # Update context
            self.context_manager.add_to_history(command, result)
            
            return result

        except Exception as e:
            logger.error(f"Error processing command: {e}")
            return {
                "message": "I encountered an error processing your request.",
                "data": {"error": str(e)}
            }

    async def _execute_command(self, parsed_response: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the command based on Llama 2's understanding."""
        intent = parsed_response["intent"]
        action = parsed_response["action"]
        entities = parsed_response["entities"]
        
        if intent == "task":
            return await self._handle_task(action, entities)
        elif intent == "reminder":
            return await self._handle_reminder(action, entities)
        elif intent == "calendar":
            return await self._handle_calendar(action, entities)
        elif intent == "workspace":
            return await self._handle_workspace(action, entities)
        elif intent == "search":
            return await self._handle_search(action, entities)
        else:
            return {
                "message": "I'm not sure how to help with that. Try asking for 'help'.",
                "data": {}
            }

    async def _handle_task(self, action: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle task-related commands."""
        if action == "create":
            task = Task(
                title=entities.get("title"),
                description=entities.get("description"),
                due_date=datetime.fromisoformat(entities["due_date"]) if entities.get("due_date") else None,
                priority=entities.get("priority", "MEDIUM"),
                user_id=self.user_id
            )
            self.db.add(task)
            self.db.commit()
            return {
                "message": f"I've created a task: {task.title}",
                "data": {"task_id": str(task.id)}
            }
        
        elif action == "list":
            tasks = self.db.query(Task).filter(
                Task.user_id == self.user_id
            ).all()
            return {
                "message": "Here are your tasks:",
                "data": {
                    "tasks": [
                        {
                            "id": str(t.id),
                            "title": t.title,
                            "status": t.status,
                            "due_date": t.due_date.isoformat() if t.due_date else None
                        } for t in tasks
                    ]
                }
            }

    async def _handle_reminder(self, action: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle reminder-related commands."""
        if action == "create":
            reminder = Reminder(
                message=entities.get("message"),
                remind_at=datetime.fromisoformat(entities["remind_at"]) if entities.get("remind_at") else None,
                user_id=self.user_id
            )
            self.db.add(reminder)
            self.db.commit()
            return {
                "message": f"I've set a reminder: {reminder.message}",
                "data": {"reminder_id": str(reminder.id)}
            }
        
        elif action == "list":
            reminders = self.db.query(Reminder).filter(
                Reminder.user_id == self.user_id
            ).all()
            return {
                "message": "Here are your reminders:",
                "data": {
                    "reminders": [
                        {
                            "id": str(r.id),
                            "message": r.message,
                            "remind_at": r.remind_at.isoformat() if r.remind_at else None
                        } for r in reminders
                    ]
                }
            }

    async def _handle_calendar(self, action: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle calendar-related commands."""
        # TODO: Implement calendar functionality
        return {"message": "Calendar functionality coming soon", "data": {}}

    async def _handle_workspace(self, action: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle workspace-related commands."""
        # TODO: Implement workspace functionality
        return {"message": "Workspace functionality coming soon", "data": {}}

    async def _handle_search(self, action: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle search-related commands."""
        query = entities.get("query", "")
        # TODO: Implement search across all relevant models
        return {
            "message": f"Search results for: {query}",
            "data": {"query": query}
        } 