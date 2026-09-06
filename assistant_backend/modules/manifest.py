from dataclasses import dataclass
from fastapi import APIRouter


@dataclass
class ModuleManifest:
    """What a pluggable module declares about itself. `icon` is a plain
    string key (not a Python icon object) so the frontend can map it to
    whatever icon set it uses without the backend knowing about React."""
    key: str
    name: str
    description: str
    icon: str
    router: APIRouter
