import uuid
from datetime import datetime, timedelta, timezone
from passlib.hash import pbkdf2_sha256
from sqlalchemy.orm import Session
from .models.pg_models import (
    User, UserSettings, Task, Workspace, Board,
    Reminder, Notification, Comment, Tag, Page, Block, Database,
    DatabaseEntry, Template, Activity, Integration,
    Contact, Deal, ContactActivity, DealActivity, Chat, ChatMessage,
    workspace_users, task_tags
)
from constants import TaskStatus, TaskType, TaskPriority, UserStatus, UserRoles, UserType


def _html(*paragraphs: str) -> str:
    """A Task's `description` (any task_type, including 'note'/'quick_note')
    is Tiptap HTML -- the actual editor everywhere in this app
    (components/dashboard/editor/RichTextEditor.js, used by both
    EditTaskDrawer.js and NewNoteDrawer.js/EditNoteDrawer.js) stores/reads
    HTML strings via editor.getHTML(), not Lexical JSON. This used to be
    named _lexical() and produce genuine Lexical-shaped JSON, matching
    what NotesPage.js's list/grid/table previews incorrectly expected at
    the time (extractTextFromLexicalJSON()) -- that was a fixture-side
    workaround for a real frontend bug (every note's preview rendered
    blank against real Tiptap-HTML content, fixtures included). Now that
    NotesPage.js correctly strips HTML for its previews instead
    (utils/htmlToText.js), fixture data needs to be real HTML too --
    otherwise opening one of these notes to actually EDIT it would show
    the raw JSON text as literal content inside the Tiptap editor."""
    return "".join(f"<p>{p}</p>" for p in paragraphs)


def _seed_workspace_content(db: Session, workspace: Workspace, owner: User, teammate: User, designer: User = None, qa_engineer: User = None):
    """Everything that lives INSIDE one workspace -- board, tasks, CRM
    data, docs, chat, etc. Shared by create_fixtures() (seeds the whole
    dev DB, 'Acme Workspace') and create_demo_account() (seeds one fresh
    visitor's own workspace) so the two don't drift out of sync with the
    actual schema independently."""

    now = datetime.now(timezone.utc)

    # ---- Boards -------------------------------------------------------------
    # Two boards, each with its own explicit "columns" so the Kanban view
    # (BoardDetailPage.js) has real column configuration to read, not just
    # the client-side default. Cards themselves are plain Tasks with
    # board_id set (see below) -- BoardItem is a dead, unused model (no
    # frontend ever calls it; removed from here for the same reason).
    board = Board(
        board_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        name="Sprint Board",
        description="Kanban board for this workspace",
        properties={"columns": ["todo", "in_progress", "review", "done"]},
        views={"default": "kanban"},
    )
    content_board = Board(
        board_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        name="Content Calendar",
        description="Launch content, tracked from draft to published",
        properties={"columns": ["todo", "in_progress", "review", "done"]},
        views={"default": "kanban"},
    )
    db.add_all([board, content_board])
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
    #
    # user_id=owner on every single one of these, deliberately -- handlers/
    # task_handler.py's list_tasks() filters strictly on
    # `Task.user_id == the logged-in caller`, not workspace membership.
    # Tasks aren't shared workspace-wide the way Contacts/Deals are; a task
    # is only ever visible to whoever's user_id created it. `teammate`
    # never logs in anywhere (create_demo_account() only ever mints a
    # token for `owner`), so any task given to `teammate` here would be
    # permanently invisible through the normal Tasks/Notes screens --
    # confirmed live: this is exactly why a demo login showed no seeded
    # note/task/quick-note/time-block data even though the rows existed in
    # the DB. teammate still shows up as `assignee_id` for realism --
    # assignment doesn't gate visibility, only creatorship does.
    task_defaults = dict(watchers=[], labels=[], meta_data={}, settings={})
    tasks = [
        # ---- Sprint Board cards -- spread across all 4 default columns so
        # the Kanban view (BoardDetailPage.js) isn't lopsided on first look.
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            order=0,
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
            order=1,
            user_id=owner.user_id,
            title="Fix flaky CI test on auth middleware",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.BUG.value,
            status=TaskStatus.IN_PROGRESS.value,
            due_on=now + timedelta(days=3),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            order=0,
            user_id=owner.user_id,
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
            order=1,
            user_id=owner.user_id,
            assignee_id=designer.user_id if designer else None,
            title="Add dark mode toggle to settings",
            priority=TaskPriority.LOW.value,
            task_type=TaskType.FEATURE.value,
            status=TaskStatus.TODO.value,
            due_on=now + timedelta(days=10),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            order=0,
            user_id=owner.user_id,
            assignee_id=teammate.user_id,
            title="Design review: onboarding flow",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.REVIEW.value,
            due_on=now + timedelta(days=1),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            order=0,
            user_id=owner.user_id,
            title="Upgrade dependency versions",
            priority=TaskPriority.LOW.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.DONE.value,
            completed=True,
            due_on=now - timedelta(days=2),
        ),
        # ---- Content Calendar cards ---------------------------------------
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=content_board.board_id,
            order=0,
            user_id=owner.user_id,
            title="Write blog post: why we rebuilt the CRM",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.TODO.value,
            due_on=now + timedelta(days=5),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=content_board.board_id,
            order=0,
            user_id=owner.user_id,
            assignee_id=teammate.user_id,
            title="Record product demo video",
            priority=TaskPriority.HIGH.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.IN_PROGRESS.value,
            due_on=now + timedelta(days=4),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=content_board.board_id,
            order=0,
            user_id=owner.user_id,
            title="Review launch announcement copy",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.REVIEW.value,
            due_on=now + timedelta(days=2),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=content_board.board_id,
            order=0,
            user_id=owner.user_id,
            title="Publish changelog for v1.2",
            priority=TaskPriority.LOW.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.DONE.value,
            completed=True,
            due_on=now - timedelta(days=3),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
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
            user_id=owner.user_id,
            title="Renew SSL certificate",
            priority=TaskPriority.URGENT.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.DONE.value,
            completed=True,
            due_on=now - timedelta(days=1),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Review pull request #142",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.IN_PROGRESS.value,
            due_on=now + timedelta(days=1),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Set up staging environment",
            priority=TaskPriority.HIGH.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.BLOCKED.value,
            due_on=now + timedelta(days=5),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Buy coffee for the office",
            priority=TaskPriority.LOW.value,
            task_type=TaskType.TASK.value,
            status=TaskStatus.TODO.value,
            due_on=now + timedelta(days=3),
        ),
        # Notes, quick notes, and time blocks are all just Tasks with a
        # different task_type (see pages/dashboard/NotesPage.js,
        # components/dashboard/sections/StickyNote.js, and
        # pages/dashboard/TimeBlockPage.js / services/taskservice.js's
        # getAllNotes()/getAllQuickNotes()/getAllTimeBlocks(), each a plain
        # GET /tasks?task_type=<x>) -- not separate tables, so each needs
        # its own row here or that screen is empty regardless of how much
        # other data exists. description uses _html() -- the Notes editor
        # (Tiptap) stores/reads HTML, not plain text (see that helper's
        # docstring for the fixture-side bug this used to paper over).
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Demo account design notes",
            description=_html(
                "Kept simple on purpose -- one owner + one teammate, one shared workspace.",
                "Real signup gives every new user their own default workspace instead.",
            ),
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.NOTE.value,
            status=TaskStatus.DONE.value,
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Meeting notes -- kickoff",
            description=_html(
                "Attendees: Demo User, Sam Teammate.",
                "Agreed: ship the CRM fix first, demo-account feature second.",
                "Action item: follow up with Northwind Traders by Friday.",
            ),
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.NOTE.value,
            status=TaskStatus.DONE.value,
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Ideas for next sprint",
            description=_html(
                "Dark mode for the CRM tables.",
                "Bulk-import contacts from CSV.",
                "Slack notification when a deal changes stage.",
            ),
            priority=TaskPriority.LOW.value,
            task_type=TaskType.NOTE.value,
            status=TaskStatus.TODO.value,
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Remember to check the Activities tab",
            description=_html("Confirm create/edit/delete all still work after the last deploy."),
            priority=TaskPriority.LOW.value,
            task_type=TaskType.QUICK_NOTE.value,
            status=TaskStatus.DONE.value,
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Ask Sam about the Globex deal",
            description=_html("They mentioned budget was confirmed -- get the exact number."),
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.QUICK_NOTE.value,
            status=TaskStatus.TODO.value,
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Focus block: CRM cleanup",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.TIME_BLOCK.value,
            status=TaskStatus.SCHEDULED.value,
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=4),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Focus block: sprint planning prep",
            priority=TaskPriority.LOW.value,
            task_type=TaskType.TIME_BLOCK.value,
            status=TaskStatus.SCHEDULED.value,
            start_time=now + timedelta(days=1, hours=1),
            end_time=now + timedelta(days=1, hours=2),
        ),
        # ---- More time blocks, spread across the rest of the week --------
        # ReportsPage.js's Schedule Analysis chart only had 2 data points
        # (both on the same 2 days) before this -- not enough to show a
        # real "busiest day" or a believable hours-by-day distribution.
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Focus block: reports feature polish",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.TIME_BLOCK.value,
            status=TaskStatus.SCHEDULED.value,
            start_time=now + timedelta(days=2, hours=3),
            end_time=now + timedelta(days=2, hours=5),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Focus block: customer calls",
            priority=TaskPriority.HIGH.value,
            task_type=TaskType.TIME_BLOCK.value,
            status=TaskStatus.SCHEDULED.value,
            start_time=now + timedelta(days=3, hours=1),
            end_time=now + timedelta(days=3, hours=2, minutes=30),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Focus block: code review catch-up",
            priority=TaskPriority.MEDIUM.value,
            task_type=TaskType.TIME_BLOCK.value,
            status=TaskStatus.SCHEDULED.value,
            start_time=now + timedelta(days=4, hours=4),
            end_time=now + timedelta(days=4, hours=6),
        ),
        Task(
            **task_defaults,
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=None,
            user_id=owner.user_id,
            title="Focus block: architecture doc writing",
            priority=TaskPriority.LOW.value,
            task_type=TaskType.TIME_BLOCK.value,
            status=TaskStatus.SCHEDULED.value,
            start_time=now + timedelta(days=5, hours=2),
            end_time=now + timedelta(days=5, hours=5),
        ),
        # ---- Historical tasks, backdated across the last 6 weeks --------
        # Everything above gets created_at defaulted to "now" (fixture-seed
        # time), so ReportsPage.js's Performance Trends chart (completion
        # rate per week, last 6 weeks) would show 0% for 5 of its 6 buckets
        # and one artificially-high "this week" spike -- not a believable
        # trend. Explicit created_at/updated_at here backdates a realistic
        # spread of completed + still-open work across each week.
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Migrate CI to GitHub Actions",
            description=_html("The old Jenkins pipeline was flaky and slow to iterate on -- every config change meant a 20-minute round trip to find out if the YAML was even valid."),
            priority=TaskPriority.HIGH.value, task_type=TaskType.TASK.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(weeks=6, days=2), updated_at=now - timedelta(weeks=6),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Audit unused npm dependencies",
            priority=TaskPriority.LOW.value, task_type=TaskType.TASK.value, status=TaskStatus.TODO.value,
            created_at=now - timedelta(weeks=6, days=1),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Set up error tracking with Sentry",
            description=_html("We were finding out about production errors from users, not from monitoring -- that's backwards."),
            priority=TaskPriority.MEDIUM.value, task_type=TaskType.TASK.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(weeks=5, days=3), updated_at=now - timedelta(weeks=5, days=1),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Rewrite auth middleware to use refresh tokens",
            description=_html("The old implementation never rotated tokens -- a stolen access token was valid forever, with no way to revoke it short of rotating the signing secret for every user at once."),
            priority=TaskPriority.HIGH.value, task_type=TaskType.BUG.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(weeks=4, days=4), updated_at=now - timedelta(weeks=4),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Evaluate Postgres read replicas",
            priority=TaskPriority.MEDIUM.value, task_type=TaskType.TASK.value, status=TaskStatus.TODO.value,
            created_at=now - timedelta(weeks=4, days=2),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Deprecate the old /v0 API routes",
            priority=TaskPriority.LOW.value, task_type=TaskType.TASK.value, status=TaskStatus.BLOCKED.value,
            created_at=now - timedelta(weeks=4),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Add rate limiting to the public API",
            description=_html("One misbehaving script was enough to degrade the API for every other tenant -- there was nothing stopping it."),
            priority=TaskPriority.HIGH.value, task_type=TaskType.FEATURE.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(weeks=2, days=3), updated_at=now - timedelta(weeks=2, days=1),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, assignee_id=qa_engineer.user_id if qa_engineer else None,
            title="Write load tests for the checkout flow",
            priority=TaskPriority.MEDIUM.value, task_type=TaskType.TASK.value, status=TaskStatus.IN_PROGRESS.value,
            created_at=now - timedelta(weeks=2, days=1),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Fix memory leak in the background worker",
            description=_html("Memory climbs steadily under load and never comes back down until the pod is restarted -- looks like a retained reference in the queue consumer's message-processing loop."),
            priority=TaskPriority.URGENT.value, task_type=TaskType.BUG.value, status=TaskStatus.TODO.value,
            created_at=now - timedelta(weeks=2),
        ),
        # ---- Daily-spread completions, last 5 days -----------------------
        # Task Completion's own trend chart is daily (not weekly) over the
        # last 7 days -- without these, everything completed "today" piles
        # onto one bar and the other 6 days show zero.
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Rotate the staging DB credentials",
            priority=TaskPriority.MEDIUM.value, task_type=TaskType.TASK.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(days=5), updated_at=now - timedelta(days=5),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Update the onboarding checklist",
            priority=TaskPriority.LOW.value, task_type=TaskType.TASK.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(days=4), updated_at=now - timedelta(days=4),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Reply to customer escalation on Zendesk",
            description=_html("Northwind Traders' integration broke after our last deploy -- walked them through a workaround and filed the real fix as a bug."),
            priority=TaskPriority.HIGH.value, task_type=TaskType.TASK.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(days=3), updated_at=now - timedelta(days=3),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Pair with Sam on the CRM bug",
            priority=TaskPriority.MEDIUM.value, task_type=TaskType.TASK.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(days=2), updated_at=now - timedelta(days=2),
        ),
        Task(
            **task_defaults, task_id=uuid.uuid4(), workspace_id=workspace.workspace_id, board_id=None,
            user_id=owner.user_id, title="Cut the v1.3 release branch",
            priority=TaskPriority.HIGH.value, task_type=TaskType.TASK.value, status=TaskStatus.DONE.value,
            completed=True, created_at=now - timedelta(days=1), updated_at=now - timedelta(days=1),
        ),
    ]
    db.add_all(tasks)
    db.commit()

    db.execute(task_tags.insert().values(task_id=tasks[0].task_id, tag_id=tags[0].id))
    db.execute(task_tags.insert().values(task_id=tasks[0].task_id, tag_id=tags[1].id))
    db.execute(task_tags.insert().values(task_id=tasks[2].task_id, tag_id=tags[2].id))  # tasks[2] = "Write onboarding docs"
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

    # ---- Reminders -------------------------------------------------------------
    # user_id=owner on all of these, deliberately -- same reason every Task
    # above uses owner.user_id: list_reminders() filters strictly on
    # Reminder.user_id == the logged-in caller, and teammate never logs in
    # anywhere (create_demo_account() only ever mints a token for owner).
    # This fixture originally assigned the first reminder to teammate,
    # which meant a demo login showed zero reminders despite the row
    # existing in the DB -- same class of bug already documented above for
    # Tasks, just not caught here until now.
    reminders = [
        Reminder(
            reminder_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=owner.user_id,
            title="Follow up on CRM fix",
            description="Check the Activities tab is stable after deploy",
            due_date=now + timedelta(days=1),
            repeat=None,
        ),
        Reminder(
            reminder_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=owner.user_id,
            title="Renew SSL certificate",
            due_date=now + timedelta(hours=6),
            repeat=None,
        ),
        Reminder(
            reminder_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=owner.user_id,
            title="Weekly team sync",
            description="Recurring standup, every Monday morning",
            due_date=now + timedelta(days=3),
            repeat="weekly",
        ),
        Reminder(
            reminder_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=owner.user_id,
            title="Submit expense report",
            due_date=now - timedelta(days=1),
            repeat=None,
            is_completed=True,
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

    # ---- Pages + Blocks (the Wiki feature, WikiDetailPage.js's block
    # editor) -- two pages, deliberately using all 7 block types between
    # them so a fresh demo shows the editor's range, not just paragraphs.
    page = Page(
        page_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        title="Team Handbook",
        properties={},
    )
    roadmap_page = Page(
        page_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        title="Product Roadmap",
        properties={},
    )
    db.add_all([page, roadmap_page])
    db.commit()

    blocks = [
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=0, type="heading",
              content={"text": "Welcome", "level": 1}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=1, type="paragraph",
              content={"text": "This page is how this team works -- conventions, tools, and expectations."}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=2, type="heading",
              content={"text": "Working agreements", "level": 2}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=3, type="bullet_list_item",
              content={"text": "Standup async in #team-updates by 10am"}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=4, type="bullet_list_item",
              content={"text": "PRs need one approval before merging"}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=5, type="divider", content={}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=6, type="heading",
              content={"text": "Onboarding checklist", "level": 2}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=7, type="todo",
              content={"text": "Get access to the shared workspace", "checked": True}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=8, type="todo",
              content={"text": "Read the CRM activities design doc", "checked": False}),
        Block(block_id=uuid.uuid4(), page_id=page.page_id, order=9, type="code",
              content={"text": "docker compose up -d\nmake load FIXTURE=ecommerce"}),
    ]
    roadmap_blocks = [
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=0, type="heading",
              content={"text": "Product Roadmap", "level": 1}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=1, type="paragraph",
              content={"text": "What's shipped, in progress, and next -- kept here instead of scattered across chat threads."}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=2, type="heading",
              content={"text": "Now", "level": 2}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=3, type="bullet_list_item",
              content={"text": "CRM activities routing fix"}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=4, type="bullet_list_item",
              content={"text": "Dark mode"}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=5, type="divider", content={}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=6, type="heading",
              content={"text": "Next", "level": 2}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=7, type="todo",
              content={"text": "Reminders", "checked": False}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=8, type="todo",
              content={"text": "Real-time collaboration on wiki pages", "checked": False}),
        Block(block_id=uuid.uuid4(), page_id=roadmap_page.page_id, order=9, type="image",
              content={"url": "https://placehold.co/600x300?text=Roadmap+Snapshot", "caption": "Placeholder -- swap for a real screenshot"}),
    ]
    db.add_all(blocks + roadmap_blocks)
    db.commit()

    # ---- Database + DatabaseEntries (the Notion-style table feature) -------
    # Fixed columns per database, set at creation (properties["columns"]) --
    # DatabaseDetailPage.js renders these as real table headers; each entry's
    # `title` is the row's first-column value, `content` holds the rest
    # keyed by column name.
    database = Database(
        database_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        title="Vendors",
        description="Tracked vendors database",
        properties={"columns": ["name", "status"]},
    )
    directory_database = Database(
        database_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        title="Team Directory",
        description="Who's who, for quick reference",
        properties={"columns": ["name", "role", "timezone"]},
    )
    db.add_all([database, directory_database])
    db.commit()

    database_entries = [
        DatabaseEntry(entry_id=uuid.uuid4(), database_id=database.database_id, title="Acme Cloud", content={"status": "active"}),
        DatabaseEntry(entry_id=uuid.uuid4(), database_id=database.database_id, title="Beta Hosting", content={"status": "trial"}),
        DatabaseEntry(entry_id=uuid.uuid4(), database_id=database.database_id, title="Northwind Traders", content={"status": "active"}),
    ]
    directory_entries = [
        DatabaseEntry(entry_id=uuid.uuid4(), database_id=directory_database.database_id, title="Demo User", content={"role": "Owner", "timezone": "UTC"}),
        DatabaseEntry(entry_id=uuid.uuid4(), database_id=directory_database.database_id, title="Sam Teammate", content={"role": "Member", "timezone": "UTC+1"}),
    ]
    db.add_all(database_entries + directory_entries)
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
        "content_board": content_board,
        "tags": tags,
        "tasks": tasks,
        "comments": comments,
        "reminders": reminders,
        "notifications": notifications,
        "page": page,
        "blocks": blocks,
        "roadmap_page": roadmap_page,
        "roadmap_blocks": roadmap_blocks,
        "database": database,
        "database_entries": database_entries,
        "directory_database": directory_database,
        "directory_entries": directory_entries,
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
            avatar_url="https://i.pravatar.cc/300?img=5",
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
            avatar_url="https://i.pravatar.cc/300?img=25",
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
            avatar_url="https://i.pravatar.cc/300?img=51",
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

    # Real, stable, freely-hotlinkable photo placeholders (i.pravatar.cc) --
    # referenced directly by URL, not downloaded and re-uploaded to our own
    # Azure Blob storage. Deliberate: fixture seeding runs synchronously on
    # every real "Try Demo" click (a live, user-facing request), so making
    # it depend on fetching external images over the network would mean any
    # hiccup reaching that host slows down or breaks a real visitor's demo
    # signup. This is the same category of choice already made elsewhere in
    # this app -- get_workspace_members() (handlers/workspace_handlers.py)
    # already hands back a ui-avatars.com URL rather than storing a file --
    # just swapping a generated-initials avatar for a real-looking stock
    # photo for the users that already have a persisted avatar_url column.
    owner = User(
        user_id=uuid.uuid4(),
        email=f"demo-{suffix}@example.com",
        # Never returned or logged in anywhere -- the demo route hands the
        # caller a real JWT directly, there is no password-based login for
        # this account. Still needs SOME hash since the column is NOT NULL.
        password_hash=pbkdf2_sha256.hash(uuid.uuid4().hex),
        first_name="Demo",
        last_name="User",
        avatar_url="https://i.pravatar.cc/300?img=12",
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
        avatar_url="https://i.pravatar.cc/300?img=33",
        status=UserStatus.ACTIVE.value,
        role=UserRoles.USER.value,
        user_type=UserType.FREE.value,
        is_email_verified=True,
    )
    # A couple more dummy members, purely so the Members page
    # (MembersPage.js, now actually functional -- see the invite/role/
    # remove fixes earlier this session) has more than one teammate to
    # show, and so Board/Task assignee fields have a wider real cast than
    # just "Sam Teammate" every time.
    designer = User(
        user_id=uuid.uuid4(),
        email=f"demo-designer-{suffix}@example.com",
        password_hash=pbkdf2_sha256.hash(uuid.uuid4().hex),
        first_name="Priya",
        last_name="Patel",
        avatar_url="https://i.pravatar.cc/300?img=47",
        status=UserStatus.ACTIVE.value,
        role=UserRoles.USER.value,
        user_type=UserType.FREE.value,
        is_email_verified=True,
    )
    qa_engineer = User(
        user_id=uuid.uuid4(),
        email=f"demo-qa-{suffix}@example.com",
        password_hash=pbkdf2_sha256.hash(uuid.uuid4().hex),
        first_name="Jordan",
        last_name="Kim",
        avatar_url="https://i.pravatar.cc/300?img=68",
        status=UserStatus.ACTIVE.value,
        role=UserRoles.USER.value,
        user_type=UserType.FREE.value,
        is_email_verified=True,
    )
    db.add_all([owner, teammate, designer, qa_engineer])
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
    db.execute(workspace_users.insert().values(
        workspace_id=workspace.workspace_id, user_id=designer.user_id, role="member"
    ))
    db.execute(workspace_users.insert().values(
        workspace_id=workspace.workspace_id, user_id=qa_engineer.user_id, role="member"
    ))
    db.commit()

    db.add_all([
        UserSettings(user_id=owner.user_id, workspace_id=workspace.workspace_id, theme="light", language="en", timezone="UTC"),
        UserSettings(user_id=teammate.user_id, workspace_id=workspace.workspace_id, theme="light", language="en", timezone="UTC"),
        UserSettings(user_id=designer.user_id, workspace_id=workspace.workspace_id, theme="light", language="en", timezone="UTC"),
        UserSettings(user_id=qa_engineer.user_id, workspace_id=workspace.workspace_id, theme="light", language="en", timezone="UTC"),
    ])
    db.commit()

    _seed_workspace_content(db, workspace, owner=owner, teammate=teammate, designer=designer, qa_engineer=qa_engineer)

    return owner, workspace
