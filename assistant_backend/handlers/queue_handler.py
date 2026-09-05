import json
import random
import uuid

from adapters.queue import AzureQueueStorage
from commands.queue_cmd import EnqueueTestMessagesCommand


class QueueHandler:
    def enqueue_test_messages(self, cmd: EnqueueTestMessagesCommand) -> dict:
        queue = AzureQueueStorage()
        for _ in range(cmd.count):
            payload = {
                "job_id": str(uuid.uuid4()),
                "work_seconds": cmd.work_seconds,
                "fail": random.random() < cmd.fail_rate,
            }
            queue.enqueue(json.dumps(payload))
        return {"enqueued": cmd.count}

    def get_status(self) -> dict:
        queue = AzureQueueStorage()
        lengths = queue.queue_lengths()
        return {
            "queue": queue.queue_name,
            "queue_length": lengths[queue.queue_name],
            "poison_queue": queue.poison_queue_name,
            "poison_queue_length": lengths[queue.poison_queue_name],
        }
