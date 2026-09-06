from fastapi import APIRouter, Depends, HTTPException
from handlers.reports_handler import ReportsHandler
from modules.access import require_module_enabled

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/reports", tags=["reports"])

# Already a live, always-on feature before the module registry existed --
# default_enabled=True so no existing workspace loses it silently.
gate = require_module_enabled("reports", default_enabled=True)


@router.get("/summary")
async def get_reports_summary(workspace_id: str, user: dict = Depends(gate)):
    """Task Completion, Time Distribution, Performance Trends, and
    Schedule Analysis in one response -- all computed live from the real
    tasks table, nothing mocked."""
    try:
        return ReportsHandler().get_summary(workspace_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


reports_router = router
