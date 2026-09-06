# Building a module

GridWork's backend is a normal FastAPI app for its core features (Tasks,
Boards, Workspaces, Auth) plus a **plug-and-play module system** for
everything else (Inventory today; Invoicing, HR, Procurement, or anything
you want, tomorrow). This doc is the guide for adding one.

The short version: create `modules/<your_key>/`, give it a `manifest.py`
that exposes a `MANIFEST`, and it's live. No edits to `main.py`, no edits
to `modules/registry.py`, no edits to anything else in the app. The app
discovers it automatically at startup (`modules/registry.py`'s
`_discover_packaged_modules()`, using `pkgutil` to scan `modules/` for
subpackages with a `manifest.py`).

## The contract

A module is a Python package under `modules/` with a `manifest.py` that
defines:

```python
from modules.manifest import ModuleManifest
from .controller import my_module_router

MANIFEST = ModuleManifest(
    key="my_module",           # unique, url-safe, used everywhere: routes, DB rows, frontend maps
    name="My Module",          # shown in Settings > Modules and the sidebar
    description="One sentence describing what it does.",
    icon="box",                # a string key -- see "Frontend" below for how it maps to a real icon
    router=my_module_router,   # a normal fastapi.APIRouter
    default_enabled=False,     # see "Enabled by default?" below
)
```

That's the entire interface the registry cares about. Everything else
(how many files, what's in them, what the routes do) is up to the module.

## Reference implementation: `modules/inventory/`

Copy this layout for a new module -- it's deliberately kept as the
canonical example other modules should look like:

```
modules/inventory/
  __init__.py       # empty
  models.py         # SQLAlchemy models, using adapters.orm.models.base.Base
  commands.py       # Pydantic request bodies (Command classes)
  dto.py            # Pydantic response bodies (Dto classes) + mappers
  handlers.py        # business logic / DB queries, one class per module
  controller.py      # FastAPI routes, each gated (see below)
  manifest.py         # the MANIFEST described above
```

Following this layout isn't enforced by the registry (only `manifest.py`
with a `MANIFEST` is required), but it matches the rest of the app's
conventions and makes a new module easy for someone else to read.

### Models

Use the same `Base` as the rest of the app so your tables share the
engine/session machinery:

```python
from adapters.orm.models.base import Base
```

Prefix your table names to avoid collisions with core tables (Inventory
uses `inv_` -- `inv_products`, `inv_warehouses`, `inv_stock_movements`).

**Migrations**: this app manages schema via Alembic, not
`create_all()` at runtime (see `adapters/orm/models/database.py`'s
`init_db()` docstring for why runtime schema rebuilding was actively
destructive). Write a normal Alembic migration for your new tables --
`assistant_backend/migrations/versions/`, following the existing
timestamp-prefixed naming convention. `init_db()` (used only by the test
suite, for a full disposable schema reset) picks your models up
automatically via `modules.registry.import_all_module_models()`, which
imports every discovered module's `models.py` if it has one -- nothing to
wire up by hand there.

### The enable/disable gate

Every route in your module should depend on `require_module_enabled`,
not `Depends(get_auth_details)` directly -- it does the same auth check
plus the workspace-membership check plus "is this module actually turned
on for this workspace":

```python
from modules.access import require_module_enabled

gate = require_module_enabled("my_module")  # default_enabled=False unless passed

@router.get("/widgets", response_model=list[WidgetDto])
async def list_widgets(workspace_id: str, user: dict = Depends(gate)):
    ...
```

`require_module_enabled(key, default_enabled=...)` takes the same
`default_enabled` your manifest declares -- keep them consistent (see
"Enabled by default?" below for what each value means operationally).

### Router prefix

Nest your router under the workspace, matching every other feature in
this app:

```python
router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/my_module", tags=["My Module"])
```

`{workspace_id}` in the prefix is what lets `require_module_enabled`'s
inner dependency resolve it automatically (FastAPI binds path params to
same-named dependency function parameters).

## Enabled by default?

`default_enabled` on both the manifest and the gate controls what a
workspace with no explicit choice gets:

- **`False`** (the default) -- the module starts off; a workspace owner
  opts in via Settings > Modules. Use this for anything genuinely new and
  optional (Inventory, and any new module you build).
- **`True`** -- the module starts on for every workspace, existing and
  new, until an owner explicitly turns it off. This is *only* for
  adopting a feature that was already always-on before it got wrapped in
  a module gate (see `ADOPTED_MODULES` in `modules/registry.py` for the
  eight features migrated this way) -- using it for a brand-new module
  would mean shipping something nobody asked to turn on.

## Frontend integration

The backend registry is the single source of truth; the frontend just
reads it back through `GET /workspaces/{id}/modules` (already generic --
no changes needed there for a new module) and needs two small,
module-specific additions:

1. **`assistant_web/src/components/dashboard/Navbar.js`**: add your
   module's `icon` key to the `MODULE_ICONS` map (pick or add a
   `react-icons/fi` icon) and its page route to the `MODULE_ROUTES` map.
   Once both exist, an enabled module automatically gets a sidebar entry
   under "Modules" -- nothing else in `Navbar.js` needs to change.
2. **A page + route**: build your module's page (see
   `assistant_web/src/pages/dashboard/InventoryPage.js` for the pattern)
   and add one `<Route>` in `App.js` pointing at it.

Settings > Modules (`SettingsPage.js`'s "Modules" tab) already lists and
toggles every registered module generically via `ModuleService` -- a new
module appears there automatically too.

## Testing

Add `assistant_backend/tests/test_<your_module>.py` using the
`signed_up_user` fixture from `conftest.py` (real signup + login against
the actual Postgres the dev stack uses, not a mock). Follow the shape of
`tests/test_inventory.py`: enable the module explicitly at the top of
each test that needs it (a fresh test-suite user starts with every
`default_enabled=False` module off), then exercise create/list/get/
update/delete plus whatever validation your module actually has (see
`test_inventory.py`'s SKU-uniqueness and negative-stock-guard tests for
what "real" coverage looks like, not just does-it-200 checks).

## What NOT to touch

Tasks, Boards, Workspaces, and Auth are core -- not modules, not
toggleable, and not something a module should assume it can change the
behavior of. A module can *reference* a task (Inventory doesn't, but a
future Procurement module linking a purchase order to a task would) by
storing a `task_id` and querying the real `Task` model, the same way any
other handler in this app does.
