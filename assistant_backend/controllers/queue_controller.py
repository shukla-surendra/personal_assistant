from fastapi import APIRouter, Depends
from starlette import status

from commands.queue_cmd import EnqueueTestMessagesCommand
from handlers.queue_handler import QueueHandler
from authorization.auth import get_auth_details

router = APIRouter(
    prefix="/api/v1/queue",
    tags=["queue"],
    responses={404: {"description": "Not found"}},
)


@router.post("/test-messages", status_code=status.HTTP_201_CREATED)
async def enqueue_test_messages(cmd: EnqueueTestMessagesCommand, user: dict = Depends(get_auth_details)):
    """Enqueue N synthetic jobs onto the KEDA scaling-test queue. Auth-gated
    -- this generates real load/cost, not a normal end-user feature."""
    return QueueHandler().enqueue_test_messages(cmd)


@router.get("/status", status_code=status.HTTP_200_OK)
async def get_queue_status(user: dict = Depends(get_auth_details)):
    """Approximate message counts for the main + poison queues -- watch
    this alongside `kubectl get hpa` while a KEDA scaling test runs."""
    return QueueHandler().get_status()


queue_router = router
