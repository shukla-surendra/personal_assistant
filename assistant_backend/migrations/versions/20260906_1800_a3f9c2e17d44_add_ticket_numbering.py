"""add ticket numbering (board key + task_number)

Revision ID: a3f9c2e17d44
Revises: e22a451be51c
Create Date: 2026-09-06 18:00:00.000000+00:00

"""
import re
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a3f9c2e17d44'
down_revision = 'e22a451be51c'
branch_labels = None
depends_on = None


def _generate_key(name, taken):
    words = re.findall(r"[A-Za-z0-9]+", name or "")
    if len(words) > 1:
        base = "".join(w[0] for w in words[:4]).upper()
    elif words:
        base = words[0][:4].upper()
    else:
        base = "BRD"
    key = base
    suffix = 2
    while key in taken:
        key = f"{base}{suffix}"
        suffix += 1
    taken.add(key)
    return key


def upgrade() -> None:
    op.add_column('boards', sa.Column('key', sa.String(), nullable=True))
    op.add_column('boards', sa.Column('next_task_number', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('tasks', sa.Column('task_number', sa.Integer(), nullable=True))

    conn = op.get_bind()

    # Backfill existing boards with a generated key, unique per workspace,
    # then assign sequential task_number to that board's existing tasks in
    # creation order so history reads the same as it would have if this
    # feature had existed from the start.
    workspaces = conn.execute(sa.text("SELECT DISTINCT workspace_id FROM boards")).fetchall()
    for (workspace_id,) in workspaces:
        taken_keys = set()
        boards = conn.execute(
            sa.text("SELECT board_id, name FROM boards WHERE workspace_id = :wid ORDER BY created_at ASC"),
            {"wid": workspace_id},
        ).fetchall()
        for board_id, name in boards:
            key = _generate_key(name, taken_keys)
            tasks = conn.execute(
                sa.text("SELECT task_id FROM tasks WHERE board_id = :bid ORDER BY created_at ASC"),
                {"bid": board_id},
            ).fetchall()
            for index, (task_id,) in enumerate(tasks, start=1):
                conn.execute(
                    sa.text("UPDATE tasks SET task_number = :n WHERE task_id = :tid"),
                    {"n": index, "tid": task_id},
                )
            conn.execute(
                sa.text("UPDATE boards SET key = :key, next_task_number = :next WHERE board_id = :bid"),
                {"key": key, "next": len(tasks) + 1, "bid": board_id},
            )


def downgrade() -> None:
    op.drop_column('tasks', 'task_number')
    op.drop_column('boards', 'next_task_number')
    op.drop_column('boards', 'key')
