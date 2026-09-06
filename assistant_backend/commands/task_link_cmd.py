from pydantic import BaseModel
from typing import Optional

LINK_TYPES = ("blocks", "relates_to", "duplicates", "clones")

# Label shown on the target task's side of the link -- e.g. task A
# "blocks" task B, so from B's perspective A "is blocked by" it.
INVERSE_LABELS = {
    "blocks": "is blocked by",
    "relates_to": "relates to",
    "duplicates": "is duplicated by",
    "clones": "is cloned by",
}


class TaskLinkCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    source_task_id: Optional[str] = None  # Set from the URL path by the controller
    target_task_id: str
    link_type: str = "relates_to"
