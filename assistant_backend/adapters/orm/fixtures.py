import uuid
from datetime import datetime, timedelta, timezone
from passlib.hash import pbkdf2_sha256
from sqlalchemy.orm import Session
from .models.pg_models import (
    User, UserSettings, Task, Workspace, Board, BoardItem,
    Reminder, Notification, Comment, Tag, Page, Block, Database,
    DatabaseEntry, Template, Activity, Integration,
    Contact, Deal, ContactActivity, DealActivity, Chat, ChatMessage,
    workspace_users, task_tags
)
from constants import TaskStatus, TaskType, TaskPriority, UserStatus, UserRoles, UserType


def _seed_workspace_content(db: Session, workspace: Workspace, owner: User, teammate: User):
    """Everything that lives INSIDE one workspace -- board, tasks, CRM
    data, docs, chat, etc. Shared by create_fixtures() (seeds the whole
    dev DB, 'Acme Workspace') and create_demo_account() (seeds one fresh
    visitor's own workspace) so the two don't drift out of sync with the
    actual schema independently."""

    now = datetime.now(timezone.utc)

    # ---- Board + BoardItems ----------------------------------------------
    board = Board(
        board_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        name="Sprint Board",
        description="Kanban board for this workspace",
        views={"default": "kanban"},
    )
    db.add(board)
    db.commit()

    board_items = [
        BoardItem(
            item_id=uuid.uuid4(),
            board_id=board.board_id,
            title="Design onboarding flow",
            description="Board-level item, independent of the tasks list",
            order=1,
            assignee_id=teammate.user_id,
        ),
        BoardItem(
            item_id=uuid.uuid4(),
            board_id=board.board_id,
            title="Ship v1 API",
            order=2,
            assignee_id=owner.user_id,
        ),
    ]
    db.add_all(board_items)
    db.commit()

    # ---- Tags --------------------------------------------------------------
    # Tag.name is globally unique across the whole app (not scoped per
    # workspace -- see pg_models.py), so this can't just always INSERT:
    # create_demo_account() calls this helper on every "Try Demo" click,
    # and a second call with the same tag names would 500 on
    # UniqueViolation. Get-or-create instead.
    tag_specs = [
        ("urgent", "#E53E3E", "Needs attention now"),
        ("backend", "#3182CE", "Server-side work"),
        ("frontend", "#38A169", "Client-side work"),
    ]
    tags = []
    for name, color, description in tag_specs:
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(id=uuid.uuid4(), name=name, color=color, description=description)
            db.add(tag)
            db.commit()
        tags.append(tag)

    # ---- Tasks + task_tags --------------------------------------------------
    # watchers/labels/meta_data/settings default to []/{} on every real
    # task the API creates (see commands/task_cmd.py) -- TaskDto requires
    # them as list/dict, not Optional, so leaving them None here (the DB
    # column itself is nullable) makes GET /tasks 500 with a Pydantic
    # validation error the moment a task lacking them is serialized.
    task_defaults = dict(watchers=[], labels=[], meta_data={}, settings={})
    tasks = [
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            user_id=owner.user_id,
            assignee_id=teammate.user_id,
            reporter_id=owner.user_id,
            title="Fix CRM activities routing",
            description="Wire ActivitiesPanel to the contact/deal-scoped endpoints",
            priority=TaskPriority.HIGH.value,
            task_type=TaskType.BUG.value,
            status=TaskStatus.IN_PROGRESS.value,
            due_on=now + timedelta(days=2),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            user_id=teammate.user_id,
            assignee_id=teammate.user_id,
            reporter_id=owner.user_id,
            title="Write onboarding docs",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.DOCUMENT.value,
            status=TaskStatus.TODO.value,
            due_on=now + timedelta(days=7),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            user_id=owner.user_id,
            title="Quarterly planning",
            priority=TaskPriority.LOW.value,
            task_type=TaskType.MEETING.value,
            status=TaskStatus.SCHEDULED.value,
            due_on=now + timedelta(days=14),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=teammate.user_id,
            title="Renew SSL certificate",
            priority=TaskPriority.URGENT.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.DONE.value,
            completed=True,
            due_on=now - timedelta(days=1),
        ),
    ]
    db.add_all(tasks)
    db.commit()

    db.execute(task_tags.insert().values(task_id=tasks[0].task_id, tag_id=tags[0].id))
    db.execute(task_tags.insert().values(task_id=tasks[0].task_id, tag_id=tags[1].id))
    db.execute(task_tags.insert().values(task_id=tasks[1].task_id, tag_id=tags[2].id))
    db.commit()

    # ---- Comments ------------------------------------------------------------
    comments = [
        Comment(
            comment_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=owner.user_id,
            task_id=tasks[0].task_id,
            content="Backend routes are in, frontend wiring next.",
        ),
        Comment(
            comment_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=teammate.user_id,
            task_id=tasks[0].task_id,
            content="Confirmed working against a live signup.",
        ),
    ]
    db.add_all(comments)
    db.commit()

    # ---- Reminders -----------------------------------------------------------
    reminders = [
        Reminder(
            reminder_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=teammate.user_id,
            title="Follow up on CRM fix",
            description="Check the Activities tab is stable after deploy",
            due_date=now + timedelta(days=1),
            repeat=None,
        ),
    ]
    db.add_all(reminders)
    db.commit()

    # ---- Notifications ---------------------------------------------------------
    notifications = [
        Notification(
            notification_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=teammate.user_id,
            title="Task assigned",
            message=f'You were assigned "{tasks[0].title}"',
            type="task_assigned",
            entity_id=tasks[0].task_id,
            entity_type="task",
        ),
        Notification(
            notification_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=owner.user_id,
            title="New comment",
            message=f"{teammate.first_name} commented on {tasks[0].title}",
            type="comment_added",
            entity_id=tasks[0].task_id,
            entity_type="task",
            is_read=True,
        ),
    ]
    db.add_all(notifications)
    db.commit()

    # ---- Pages + Blocks (the docs/wiki feature) -----------------------------
    page = Page(
        page_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        title="Team Handbook",
        content={"summary": "How this team works"},
    )
    db.add(page)
    db.commit()

    blocks = [
        Block(block_id=uuid.uuid4(), page_id=page.page_id, type="heading", content={"text": "Welcome"}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, type="paragraph", content={"text": "This page is a fixture example of the Pages/Blocks feature."}),
    ]
    db.add_all(blocks)
    db.commit()

    # ---- Database + DatabaseEntries (the Notion-style table feature) -------
    database = Database(
        database_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        title="Vendors",
        description="Tracked vendors database",
        properties={"columns": ["name", "status"]},
    )
    db.add(database)
    db.commit()

    database_entries = [
        DatabaseEntry(entry_id=uuid.uuid4(), database_id=database.database_id, title="Acme Cloud", content={"status": "active"}),
        DatabaseEntry(entry_id=uuid.uuid4(), database_id=database.database_id, title="Beta Hosting", content={"status": "trial"}),
    ]
    db.add_all(database_entries)
    db.commit()

    # ---- Templates --------------------------------------------------------
    templates = [
        Template(
            template_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            title="Bug report",
            description="Standard bug report template",
            content={"fields": ["steps_to_reproduce", "expected", "actual"]},
            tags=["bug", "template"],
        ),
    ]
    db.add_all(templates)
    db.commit()

    # ---- Activities (generic workspace activity feed, distinct from the
    # CRM-specific ContactActivity/DealActivity below) ------------------------
    activities = [
        Activity(
            activity_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=owner.user_id,
            action="created",
            entity_type="task",
            entity_id=tasks[0].task_id,
            details={"title": tasks[0].title},
        ),
        Activity(
            activity_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=teammate.user_id,
            action="commented",
            entity_type="task",
            entity_id=tasks[0].task_id,
            details={"comment_id": str(comments[1].comment_id)},
        ),
    ]
    db.add_all(activities)
    db.commit()

    # ---- Integrations --------------------------------------------------------
    integrations = [
        Integration(
            integration_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            name="Slack",
            type="slack",
            settings={"channel": "#general"},
            is_active=True,
        ),
    ]
    db.add_all(integrations)
    db.commit()

    # ---- CRM: Contacts, Deals, and their activities ---------------------------
    contacts = [
        Contact(
            contact_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            first_name="Jordan",
            last_name="Lee",
            email="jordan.lee@example.com",
            phone="+1-555-0100",
            company="Northwind Traders",
            job_title="VP Engineering",
            tags=["prospect", "enterprise"],
            status="active",
            source="referral",
        ),
        Contact(
            contact_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            first_name="Priya",
            last_name="Nair",
            email="priya.nair@example.com",
            company="Globex Corp",
            job_title="Head of Ops",
            tags=["customer"],
            status="active",
            source="website",
        ),
    ]
    db.add_all(contacts)
    db.commit()

    deals = [
        Deal(
            deal_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            contact_id=contacts[0].contact_id,
            title="Northwind — annual contract",
            value=45000,
            currency="USD",
            stage="proposal",
            probability=60,
            expected_close_date=now + timedelta(days=30),
            status="active",
        ),
        Deal(
            deal_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            contact_id=contacts[1].contact_id,
            title="Globex — expansion",
            value=12000,
            currency="USD",
            stage="negotiation",
            probability=80,
            expected_close_date=now + timedelta(days=10),
            status="active",
        ),
    ]
    db.add_all(deals)
    db.commit()

    contact_activities = [
        ContactActivity(
            activity_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            contact_id=contacts[0].contact_id,
            user_id=owner.user_id,
            type="call",
            title="Intro call",
            description="Discussed requirements and timeline",
            scheduled_at=now - timedelta(days=3),
            completed_at=now - timedelta(days=3),
            status="completed",
        ),
        ContactActivity(
            activity_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            contact_id=contacts[1].contact_id,
            user_id=teammate.user_id,
            type="email",
            title="Sent proposal",
            status="pending",
        ),
    ]
    db.add_all(contact_activities)
    db.commit()

    deal_activities = [
        DealActivity(
            activity_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            deal_id=deals[0].deal_id,
            user_id=owner.user_id,
            type="stage_change",
            title="Moved to proposal",
            old_stage="qualified",
            new_stage="proposal",
        ),
        DealActivity(
            activity_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            deal_id=deals[1].deal_id,
            user_id=teammate.user_id,
            type="note",
            title="Champion confirmed budget",
        ),
    ]
    db.add_all(deal_activities)
    db.commit()

    # ---- Chat + ChatMessages (the AI assistant feature) ------------------
    chat = Chat(
        chat_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        user_id=owner.user_id,
        title="Getting started",
        model="gpt-3.5-turbo",
    )
    db.add(chat)
    db.commit()

    chat_messages = [
        ChatMessage(message_id=uuid.uuid4(), chat_id=chat.chat_id, role="user", content="What can you help me with?"),
        ChatMessage(message_id=uuid.uuid4(), chat_id=chat.chat_id, role="assistant", content="I can help you manage tasks, contacts, and deals in this workspace."),
    ]
    db.add_all(chat_messages)
    db.commit()

    return {
        "board": board,
        "board_items": board_items,
        "tags": tags,
        "tasks": tasks,
        "comments": comments,
        "reminders": reminders,
        "notifications": notifications,
        "page": page,
        "blocks": blocks,
        "database": database,
        "database_entries": database_entries,
        "templates": templates,
        "activities": activities,
        "integrations": integrations,
        "contacts": contacts,
        "deals": deals,
        "contact_activities": contact_activities,
        "deal_activities": deal_activities,
        "chat": chat,
        "chat_messages": chat_messages,
    }


def create_fixtures(db: Session):
    """Seeds the whole dev DB: 3 users (admin/member/guest), each with
    their own default workspace (see the get_default_workspace() note
    below), plus one shared 'Acme Workspace' fully populated -- covers
    every model in adapters/orm/models/pg_models.py, not just the
    tasks/boards subset the old version of this file had (which also
    referenced TimeBlock/board_users, neither of which exist in the
    current schema -- this silently never ran)."""

    # ---- Users ----------------------------------------------------------
    users = [
        User(
            user_id=uuid.uuid4(),
            email="admin@example.com",
            password_hash=pbkdf2_sha256.hash("Admin@123"),
            first_name="Ada",
            last_name="Admin",
            status=UserStatus.ACTIVE.value,
            role=UserRoles.ADMIN.value,
            user_type=UserType.PREMIUM.value,
            is_email_verified=True,
        ),
        User(
            user_id=uuid.uuid4(),
            email="member@example.com",
            password_hash=pbkdf2_sha256.hash("Member@123"),
            first_name="Mia",
            last_name="Member",
            status=UserStatus.ACTIVE.value,
            role=UserRoles.USER.value,
            user_type=UserType.FREE.value,
            is_email_verified=True,
        ),
        User(
            user_id=uuid.uuid4(),
            email="guest@example.com",
            password_hash=pbkdf2_sha256.hash("Guest@123"),
            first_name="Gus",
            last_name="Guest",
            status=UserStatus.ACTIVE.value,
            role=UserRoles.GUEST.value,
            user_type=UserType.FREE.value,
            is_email_verified=False,
        ),
    ]
    db.add_all(users)
    db.commit()
    admin, member, guest = users

    # ---- Workspace + membership ------------------------------------------
    workspace = Workspace(
        workspace_id=uuid.uuid4(),
        owner_id=admin.user_id,
        name="Acme Workspace",
        description="Fixture workspace covering every feature the app supports",
        is_default=True,
    )
    db.add(workspace)
    db.commit()

    db.execute(workspace_users.insert().values(
        workspace_id=workspace.workspace_id, user_id=admin.user_id, role="admin"
    ))
    db.execute(workspace_users.insert().values(
        workspace_id=workspace.workspace_id, user_id=member.user_id, role="member"
    ))
    db.execute(workspace_users.insert().values(
        workspace_id=workspace.workspace_id, user_id=guest.user_id, role="guest"
    ))
    db.commit()

    # get_default_workspace() (adapters/storage/postgresql_adapter.py) only
    # ever resolves a workspace the user OWNS with is_default=True -- being
    # a workspace_users member (like member/guest above) is not enough, the
    # same way real signup gives every new user their own default
    # workspace. Without this, member@/guest@ can log in but their
    # `default_workspace` comes back null and every workspace-scoped
    # endpoint 500s on a literal "None" workspace_id.
    member_workspace = Workspace(
        workspace_id=uuid.uuid4(),
        owner_id=member.user_id,
        name="Mia's Workspace",
        is_default=True,
    )
    guest_workspace = Workspace(
        workspace_id=uuid.uuid4(),
        owner_id=guest.user_id,
        name="Gus's Workspace",
        is_default=True,
    )
    db.add_all([member_workspace, guest_workspace])
    db.commit()

    db.execute(workspace_users.insert().values(
        workspace_id=member_workspace.workspace_id, user_id=member.user_id, role="admin"
    ))
    db.execute(workspace_users.insert().values(
        workspace_id=guest_workspace.workspace_id, user_id=guest.user_id, role="admin"
    ))
    db.commit()

    # ---- UserSettings (needs workspace_id -- the old fixtures created
    # this BEFORE the workspace existed, which would have failed the
    # not-null FK the moment this file was actually importable) ----------
    user_settings = [
        UserSettings(user_id=admin.user_id, workspace_id=workspace.workspace_id, theme="dark", language="en", timezone="UTC"),
        UserSettings(user_id=member.user_id, workspace_id=workspace.workspace_id, theme="light", language="en", timezone="UTC"),
        UserSettings(user_id=guest.user_id, workspace_id=workspace.workspace_id, theme="light", language="en", timezone="UTC"),
    ]
    db.add_all(user_settings)
    db.commit()

    content = _seed_workspace_content(db, workspace, owner=admin, teammate=member)

    return {
        "users": users,
        "user_settings": user_settings,
        "workspace": workspace,
        "member_workspace": member_workspace,
        "guest_workspace": guest_workspace,
        **content,
    }


def create_demo_account(db: Session):
    """Self-serve 'Try Demo' path: one brand-new, isolated user + owned
    workspace, fully populated via the same _seed_workspace_content() the
    dev-DB fixtures use, plus a second throwaway teammate user so the
    seeded comments/assignments have someone to attribute to. Each call
    creates a NEW account (unique random email) rather than resetting a
    shared one -- safe for multiple concurrent demo visitors, at the cost
    of accumulating demo rows over time (nothing here deletes old ones).

    Returns the new owner User plus their default Workspace so the caller
    (the /api/v1/users/demo route) can mint a real JWT and shape a
    login-response-compatible payload -- this function itself has no
    opinion on tokens/HTTP.
    """
    suffix = uuid.uuid4().hex[:8]

    owner = User(
        user_id=uuid.uuid4(),
        email=f"demo-{suffix}@example.com",
        # Never returned or logged in anywhere -- the demo route hands the
        # caller a real JWT directly, there is no password-based login for
        # this account. Still needs SOME hash since the column is NOT NULL.
        password_hash=pbkdf2_sha256.hash(uuid.uuid4().hex),
        first_name="Demo",
        last_name="User",
        status=UserStatus.ACTIVE.value,
        role=UserRoles.ADMIN.value,
        user_type=UserType.FREE.value,
        is_email_verified=True,
    )
    teammate = User(
        user_id=uuid.uuid4(),
        email=f"demo-teammate-{suffix}@example.com",
        password_hash=pbkdf2_sha256.hash(uuid.uuid4().hex),
        first_name="Sam",
        last_name="Teammate",
        status=UserStatus.ACTIVE.value,
        role=UserRoles.USER.value,
        user_type=UserType.FREE.value,
        is_email_verified=True,
    )
    db.add_all([owner, teammate])
    db.commit()

    workspace = Workspace(
        workspace_id=uuid.uuid4(),
        owner_id=owner.user_id,
        name="Demo Workspace",
        description="Sample data covering every feature -- CRM, tasks, boards, docs, chat",
        is_default=True,
    )
    db.add(workspace)
    db.commit()

    db.execute(workspace_users.insert().values(
        workspace_id=workspace.workspace_id, user_id=owner.user_id, role="admin"
    ))
    db.execute(workspace_users.insert().values(
        workspace_id=workspace.workspace_id, user_id=teammate.user_id, role="member"
    ))
    db.commit()

    db.add_all([
        UserSettings(user_id=owner.user_id, workspace_id=workspace.workspace_id, theme="light", language="en", timezone="UTC"),
        UserSettings(user_id=teammate.user_id, workspace_id=workspace.workspace_id, theme="light", language="en", timezone="UTC"),
    ])
    db.commit()

    _seed_workspace_content(db, workspace, owner=owner, teammate=teammate)

    return owner, workspace
