from fastapi import Depends, HTTPException, status
from authorization.auth import get_auth_details
from handlers.workspace_handlers import WorkspaceHandler
from adapters.orm.models.pg_models import WorkspaceModule
from adapters.orm.models.database import SessionLocal


def is_module_enabled(workspace_id: str, module_key: str) -> bool:
    db = SessionLocal()
    try:
        row = db.query(WorkspaceModule).filter(
            WorkspaceModule.workspace_id == workspace_id,
            WorkspaceModule.module_key == module_key,
        ).first()
        return bool(row and row.enabled)
    finally:
        db.close()


def require_module_enabled(module_key: str):
    """FastAPI dependency factory: auth + workspace membership + "is this
    module switched on for this workspace" in one gate, so every module
    route gets the same enforcement core routes get from
    Depends(get_auth_details) + _verify_workspace_access, plus the extra
    check plug-and-play modules need. A module that's never been enabled
    (no row at all) is disabled by default -- nothing turns itself on."""
    def _dependency(workspace_id: str, user: dict = Depends(get_auth_details)):
        WorkspaceHandler().get_workspace(workspace_id, user.get("user_id"))
        if not is_module_enabled(workspace_id, module_key):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"The '{module_key}' module is not enabled for this workspace",
            )
        return user
    return _dependency
