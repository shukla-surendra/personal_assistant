"""add reminders table

Revision ID: 20240321_add_reminders_table
Revises: 20240321_add_board_items_table
Create Date: 2024-03-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20240321_add_reminders_table'
down_revision: Union[str, None] = '20240321_add_board_items_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create reminders table
    op.create_table(
        'reminders',
        sa.Column('reminder_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entity_type', sa.String, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String, nullable=False),
        sa.Column('description', sa.String),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('repeat', sa.String),
        sa.Column('status', sa.String, nullable=False, server_default='pending'),
        sa.Column('properties', postgresql.JSONB, server_default='{}'),
        sa.Column('is_deleted', sa.Boolean, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.workspace_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE')
    )

    # Create indexes for faster lookups
    op.create_index('ix_reminders_workspace_id', 'reminders', ['workspace_id'])
    op.create_index('ix_reminders_user_id', 'reminders', ['user_id'])
    op.create_index('ix_reminders_entity_id', 'reminders', ['entity_id'])
    op.create_index('ix_reminders_due_date', 'reminders', ['due_date'])


def downgrade() -> None:
    # Drop the reminders table
    op.drop_table('reminders') 