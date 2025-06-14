from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from pydantic import BaseModel
from core.agent import Agent
from authorization.auth import get_auth_details

router = APIRouter(
    prefix="/api/v1/assistant",
    tags=["Assistant"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
    },
)

class CommandRequest(BaseModel):
    """Request model for assistant commands."""
    command: str

class CommandResponse(BaseModel):
    """Response model for assistant commands."""
    message: str
    data: Dict[str, Any] = {}

@router.post("/command", response_model=CommandResponse)
async def process_command(
    request: CommandRequest,
    user: dict = Depends(get_auth_details)
):
    """Process a natural language command using the agent system."""
    try:
        agent = Agent(user.get("user_id"))
        response = await agent.process_command(request.command)
        return CommandResponse(**response)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

assistant_router = router 