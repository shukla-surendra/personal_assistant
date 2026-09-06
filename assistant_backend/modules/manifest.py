from dataclasses import dataclass
from fastapi import APIRouter


@dataclass
class ModuleManifest:
    """What a pluggable module declares about itself. `icon` is a plain
    string key (not a Python icon object) so the frontend can map it to
    whatever icon set it uses without the backend knowing about React.

    `default_enabled` is what a workspace gets when it has no explicit
    WorkspaceModule row yet: True for a feature that was already live
    before it became a toggleable module (so converting it to a module
    doesn't yank it out from under existing workspaces), False for a
    genuinely new/optional module like Inventory that should stay off
    until someone opts in."""
    key: str
    name: str
    description: str
    icon: str
    router: APIRouter
    default_enabled: bool = False
