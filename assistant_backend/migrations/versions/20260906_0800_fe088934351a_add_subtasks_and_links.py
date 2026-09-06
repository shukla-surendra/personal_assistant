"""add subtasks and issue links

Revision ID: fe088934351a
Revises: 21435619f7d2
Create Date: 2026-09-06 08:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fe088934351a'
down_revision = '21435619f7d2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('parent_task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.task_id', ondelete='SET NULL'), nullable=True))

    op.create_table(
        'task_links',
        sa.Column('link_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.task_id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.task_id', ondelete='CASCADE'), nullable=False),
        sa.Column('link_type', sa.String(), nullable=False, server_default='relates_to'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('task_links')
    op.drop_column('tasks', 'parent_task_id')
