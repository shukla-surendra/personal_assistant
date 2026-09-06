"""The plug-and-play module registry.

Two kinds of entries live here:

1. Fresh modules built as self-contained packages (see modules/inventory/
   for the template: its own models/commands/dto/handlers/controller/
   manifest). Adding one of these means creating that package, then
   adding one import + one line to ALL_MODULES below -- nothing else in
   the app needs to know it exists ahead of time.

2. Pre-existing features (CRM, Wiki, Database, Chat, Reports, Reminders,
   Notifications, Templates) that were always-on before this registry
   existed and got "adopted" into it -- their code stays exactly where it
   already lived (controllers/, handlers/, commands/, dto/), only their
   routes gained a require_module_enabled(key, default_enabled=True) gate
   (see e.g. controllers/crm_controller.py). They're declared as
   manifests directly below instead of getting their own modules/<key>/
   package, since there's no new code to house.

Either way, main.py includes every router in ALL_MODULES's list, and the
frontend reads the same manifests back through GET /workspaces/{id}/modules.
"""
from controllers.crm_controller import crm_router
from controllers.page_controller import page_router
from controllers.database_controller import database_router
from controllers.chat_controller import chat_router
from controllers.reports_controller import reports_router
from controllers.reminder_controller import reminder_router
from controllers.notification_controller import notification_router
from controllers.template_controller import template_router
from .manifest import ModuleManifest
from .inventory.manifest import MANIFEST as INVENTORY_MODULE

ALL_MODULES = [
    INVENTORY_MODULE,
    ModuleManifest(key="crm", name="CRM", description="Contacts, deals, and activity tracking.", icon="users", router=crm_router, default_enabled=True),
    ModuleManifest(key="wiki", name="Wiki", description="Nested pages and documents.", icon="book", router=page_router, default_enabled=True),
    ModuleManifest(key="database", name="Database", description="Structured tables with custom columns.", icon="database", router=database_router, default_enabled=True),
    ModuleManifest(key="chat", name="Chat", description="AI-assisted chat threads.", icon="chat", router=chat_router, default_enabled=True),
    ModuleManifest(key="reports", name="Reports", description="Workspace analytics and charts.", icon="chart", router=reports_router, default_enabled=True),
    ModuleManifest(key="reminders", name="Reminders", description="Time-based reminders.", icon="bell", router=reminder_router, default_enabled=True),
    ModuleManifest(key="notifications", name="Notifications", description="In-app notification feed.", icon="inbox", router=notification_router, default_enabled=True),
    ModuleManifest(key="templates", name="Templates", description="Reusable page/task templates.", icon="layout", router=template_router, default_enabled=True),
]

MODULES_BY_KEY = {m.key: m for m in ALL_MODULES}


def get_manifest(key: str):
    return MODULES_BY_KEY.get(key)


def import_all_module_models():
    """Import every *newly-built* module's models submodule so its tables
    register on Base.metadata -- needed by
    adapters.orm.models.database.init_db()'s create_all() (the test
    suite's schema reset), since a model class that's never imported
    anywhere is invisible to SQLAlchemy. Adopted pre-existing features
    don't need an entry here -- their models already live in pg_models.py
    and init_db() already imports that module directly."""
    from .inventory import models  # noqa: F401
