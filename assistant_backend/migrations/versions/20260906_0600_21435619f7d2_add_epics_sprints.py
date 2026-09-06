"""add epics sprints

Revision ID: 21435619f7d2
Revises: 02ebc93e2bd7
Create Date: 2026-09-06 06:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '21435619f7d2'
down_revision = '02ebc93e2bd7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'epics',
        sa.Column('epic_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('board_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('boards.board_id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('color', sa.String(), nullable=False, server_default='#6554C0'),
        sa.Column('status', sa.String(), nullable=False, server_default='open'),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_table(
        'sprints',
        sa.Column('sprint_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('board_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('boards.board_id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('goal', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='planned'),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.add_column('tasks', sa.Column('epic_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('epics.epic_id', ondelete='SET NULL'), nullable=True))
    op.add_column('tasks', sa.Column('sprint_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sprints.sprint_id', ondelete='SET NULL'), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'sprint_id')
    op.drop_column('tasks', 'epic_id')
    op.drop_table('sprints')
    op.drop_table('epics')
