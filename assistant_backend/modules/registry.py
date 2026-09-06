"""The plug-and-play module registry.

Adding a new module means: create `modules/<key>/` with its own
models/commands/dto/handlers/controller/manifest (see modules/inventory/
for the template), then add one import + one line below. Nothing else in
the app -- not main.py, not the frontend nav -- needs to know a new
module exists ahead of time; main.py includes every router in
ALL_MODULES's list, and the frontend reads the same manifests back
through GET /workspaces/{id}/modules.
"""
from .inventory.manifest import MANIFEST as INVENTORY_MODULE

ALL_MODULES = [
    INVENTORY_MODULE,
]

MODULES_BY_KEY = {m.key: m for m in ALL_MODULES}


def get_manifest(key: str):
    return MODULES_BY_KEY.get(key)


def import_all_module_models():
    """Import every module's models submodule so its tables register on
    Base.metadata -- needed by adapters.orm.models.database.init_db()'s
    create_all() (the test suite's schema reset), since a model class
    that's never imported anywhere is invisible to SQLAlchemy."""
    from .inventory import models  # noqa: F401
