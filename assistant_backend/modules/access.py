from fastapi import Depends, HTTPException, status
from authorization.auth import get_auth_details
from handlers.workspace_handlers import WorkspaceHandler
from adapters.orm.models.pg_models import WorkspaceModule
from adapters.orm.models.database import SessionLocal


def is_module_enabled(workspace_id: str, module_key: str, default_enabled: bool = False) -> bool:
    db = SessionLocal()
    try:
        row = db.query(WorkspaceModule).filter(
            WorkspaceModule.workspace_id == workspace_id,
            WorkspaceModule.module_key == module_key,
        ).first()
        # No row yet means "never explicitly toggled" -- fall back to the
        # module's own default rather than treating silence as "off",
        # since a formerly-always-on feature (CRM, Wiki, ...) needs to
        # keep working for every workspace that existed before it became
        # a toggleable module.
        return row.enabled if row else default_enabled
    finally:
        db.close()


def require_module_enabled(module_key: str, default_enabled: bool = False):
    """FastAPI dependency factory: auth + workspace membership + "is this
    module switched on for this workspace" in one gate, so every module
    route gets the same enforcement core routes get from
    Depends(get_auth_details) + _verify_workspace_access, plus the extra
    check plug-and-play modules need. `default_enabled` mirrors the
    module's own manifest (see modules/manifest.py) -- pass True here for
    a module that also has to default on."""
    def _dependency(workspace_id: str, user: dict = Depends(get_auth_details)):
        WorkspaceHandler().get_workspace(workspace_id, user.get("user_id"))
        if not is_module_enabled(workspace_id, module_key, default_enabled):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"The '{module_key}' module is not enabled for this workspace",
            )
        return user
    return _dependency
