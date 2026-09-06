import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
from authorization.auth import get_auth_details
from handlers.workspace_handlers import WorkspaceHandler
from adapters.orm.models.pg_models import WorkspaceModule
from adapters.orm.models.database import SessionLocal
from modules.registry import ALL_MODULES
from config import logger

router = APIRouter(
    prefix="/api/v1/workspaces/{workspace_id}/modules",
    tags=["Modules"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
        status.HTTP_403_FORBIDDEN: {"description": "Operation not permitted"},
    },
)


class ModuleDto(BaseModel):
    key: str
    name: str
    description: str
    icon: str
    enabled: bool


class ModuleToggleCommand(BaseModel):
    enabled: bool


@router.get("/", response_model=List[ModuleDto])
async def list_modules(workspace_id: str, user: dict = Depends(get_auth_details)):
    WorkspaceHandler().get_workspace(workspace_id, user.get("user_id"))
    db = SessionLocal()
    try:
        rows = db.query(WorkspaceModule).filter(WorkspaceModule.workspace_id == workspace_id).all()
        state_by_key = {row.module_key: row.enabled for row in rows}
        return [
            ModuleDto(
                key=m.key, name=m.name, description=m.description, icon=m.icon,
                # No row yet -- same "never toggled" fallback the
                # enforcement gate uses (modules/access.py) -- otherwise
                # this list would show a module as off while its routes
                # (correctly) still accept requests.
                enabled=state_by_key.get(m.key, m.default_enabled),
            )
            for m in ALL_MODULES
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing modules: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.put("/{module_key}", response_model=ModuleDto)
async def toggle_module(workspace_id: str, module_key: str, command: ModuleToggleCommand, user: dict = Depends(get_auth_details)):
    workspace = WorkspaceHandler().get_workspace(workspace_id, user.get("user_id"))
    # Enabling/disabling a module is a workspace-level setting, same bar
    # as inviting members -- gated to the owner, not any member.
    if str(workspace.owner_id) != str(user.get("user_id")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the workspace owner can manage modules")

    manifest = next((m for m in ALL_MODULES if m.key == module_key), None)
    if not manifest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown module")

    db = SessionLocal()
    try:
        row = db.query(WorkspaceModule).filter(
            WorkspaceModule.workspace_id == workspace_id,
            WorkspaceModule.module_key == module_key,
        ).first()
        if not row:
            row = WorkspaceModule(workspace_id=workspace_id, module_key=module_key, enabled=False)
            db.add(row)

        row.enabled = command.enabled
        row.enabled_at = datetime.datetime.now(datetime.UTC) if command.enabled else None
        row.enabled_by = user.get("user_id") if command.enabled else None
        db.commit()

        return ModuleDto(key=manifest.key, name=manifest.name, description=manifest.description, icon=manifest.icon, enabled=row.enabled)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error toggling module: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


module_router = router
