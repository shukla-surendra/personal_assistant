from azure.storage.queue import QueueServiceClient
from azure.core.exceptions import ResourceExistsError
from azure.identity import DefaultAzureCredential
from config import get_config, logger

config = get_config()


class AzureQueueStorage:
    """KEDA scaling-test job queue. Same auth split as AzureBlobStorage:
    prod (AKS) authenticates via Workload Identity, local dev points the
    same SDK at Azurite via AZURE_STORAGE_CONNECTION_STRING instead --
    one code path, not two. Deliberately SQS-shaped: receive_messages
    hands out a visibility timeout, not an immediate delete -- the caller
    must explicitly delete_message to ack, or the message reappears for
    another consumer once the timeout expires (at-least-once delivery,
    same as SQS)."""

    def __init__(self):
        if config.AZURE_STORAGE_CONNECTION_STRING:
            self.client = QueueServiceClient.from_connection_string(
                config.AZURE_STORAGE_CONNECTION_STRING
            )
        else:
            self.client = QueueServiceClient(
                account_url=config.AZURE_STORAGE_QUEUE_URL,
                credential=DefaultAzureCredential(),
            )

        self.queue_name = config.AZURE_STORAGE_QUEUE_NAME
        self.poison_queue_name = config.AZURE_STORAGE_QUEUE_POISON_NAME
        self.max_delivery_count = config.AZURE_QUEUE_MAX_DELIVERY_COUNT
        self.visibility_timeout = config.AZURE_QUEUE_VISIBILITY_TIMEOUT_SECONDS

        self.queue = self.client.get_queue_client(self.queue_name)
        self.poison_queue = self.client.get_queue_client(self.poison_queue_name)
        self._ensure_queues()

    def _ensure_queues(self):
        """Idempotent -- Azurite starts with no queues at all, and a
        freshly-provisioned storage account has none either until this
        runs once (mirrors AzureBlobStorage._ensure_container)."""
        for q in (self.queue, self.poison_queue):
            try:
                q.create_queue()
            except ResourceExistsError:
                pass

    def enqueue(self, content: str) -> None:
        self.queue.send_message(content)
        logger.info(f"Enqueued job onto {self.queue_name}")

    def receive_messages(self, max_messages: int = 10):
        """Returns up to max_messages, each invisible to other consumers
        for self.visibility_timeout seconds. A message not deleted before
        that window expires becomes visible again -- SQS's exact retry
        mechanism, no separate 'nack' call needed."""
        return list(
            self.queue.receive_messages(
                max_messages=max_messages,
                visibility_timeout=self.visibility_timeout,
            )
        )

    def delete_message(self, message) -> None:
        """The ack -- call only after processing actually succeeded."""
        self.queue.delete_message(message)

    def move_to_poison(self, message) -> None:
        """Hand-rolled dead-letter: Storage Queue has no native DLQ the way
        Service Bus does, so exceeding max_delivery_count means copying the
        content into a second queue ourselves, then deleting the original
        -- not just leaving it to expire and retry forever."""
        self.poison_queue.send_message(message.content)
        self.queue.delete_message(message)
        logger.info(
            f"Moved message {message.id} to {self.poison_queue_name} "
            f"after {message.dequeue_count} failed attempts"
        )

    def queue_lengths(self) -> dict:
        """Approximate -- Azure Queue's own documented semantics (counts
        can lag slightly under concurrent traffic), same caveat SQS's
        ApproximateNumberOfMessages carries. Good enough for the status
        endpoint driving this KEDA demo, not a billing-accurate count."""
        return {
            self.queue_name: self.queue.get_queue_properties().approximate_message_count,
            self.poison_queue_name: self.poison_queue.get_queue_properties().approximate_message_count,
        }
