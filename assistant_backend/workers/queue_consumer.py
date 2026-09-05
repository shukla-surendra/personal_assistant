import asyncio
import json

from config import get_config, logger
from adapters.queue import AzureQueueStorage

config = get_config()

# Empty when the queue isn't configured (e.g. minikube, or plain
# docker-compose without Azurite's queue service) -- same graceful-absence
# shape as AzureBlobStorage, just checked once at startup instead of lazily
# per-request, since this loop runs continuously rather than on demand.
QUEUE_AVAILABLE = bool(config.AZURE_STORAGE_CONNECTION_STRING or config.AZURE_STORAGE_QUEUE_URL)

POLL_INTERVAL_SECONDS = 3  # how long to sleep after an empty receive, to avoid a hot loop


async def _process_message(queue: AzureQueueStorage, message) -> None:
    """SQS-shaped: exceed max_delivery_count -> poison queue. Otherwise
    simulate the work described by the message, then either delete (ack,
    on success) or do nothing (on a deliberate failure -- the message
    reappears once its visibility timeout expires, for this or another
    consumer to retry, same as SQS's default at-least-once redelivery)."""
    if message.dequeue_count > queue.max_delivery_count:
        queue.move_to_poison(message)
        return

    try:
        payload = json.loads(message.content)
    except (json.JSONDecodeError, TypeError):
        payload = {}

    work_seconds = payload.get("work_seconds", 2)
    should_fail = payload.get("fail", False)

    await asyncio.sleep(work_seconds)

    if should_fail:
        logger.warning(
            f"Job {message.id} deliberately failed "
            f"(attempt {message.dequeue_count}/{queue.max_delivery_count}) -- "
            f"leaving it for redelivery"
        )
        return

    queue.delete_message(message)
    logger.info(f"Job {message.id} processed successfully")


async def run_consumer(stop_event: asyncio.Event) -> None:
    """One consumer loop per pod -- under KEDA, every scaled-up replica
    runs its own copy of this, all polling the SAME queue concurrently.
    Azure Queue's visibility-timeout mechanism (not this code) is what
    keeps two replicas from processing the same message at once, exactly
    the same guarantee SQS gives a horizontally-scaled consumer fleet."""
    if not QUEUE_AVAILABLE:
        logger.info("Queue not configured -- background consumer not starting")
        return

    queue = AzureQueueStorage()
    logger.info(f"Queue consumer started, polling '{queue.queue_name}'")

    while not stop_event.is_set():
        messages = await asyncio.to_thread(queue.receive_messages, 10)
        if not messages:
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
            continue
        for message in messages:
            await _process_message(queue, message)
