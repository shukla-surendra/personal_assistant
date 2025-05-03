"""add notifications table

Revision ID: 20240321_add_notifications_table
Revises: 20240321_add_reminders_table
Create Date: 2024-03-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20240321_add_notifications_table'
down_revision: Union[str, None] = '20240321_add_reminders_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('notification_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entity_type', sa.String, nullable=False),
        sa.Column('title', sa.String, nullable=False),
        sa.Column('message', sa.String, nullable=False),
        sa.Column('type', sa.String, nullable=False),
        sa.Column('status', sa.String, nullable=False, server_default='unread'),
        sa.Column('action_url', sa.String),
        sa.Column('properties', postgresql.JSONB, server_default='{}'),
        sa.Column('is_deleted', sa.Boolean, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.workspace_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE')
    )

    # Create indexes for faster lookups
    op.create_index('ix_notifications_workspace_id', 'notifications', ['workspace_id'])
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_entity_id', 'notifications', ['entity_id'])
    op.create_index('ix_notifications_status', 'notifications', ['status'])
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])


def downgrade() -> None:
    # Drop the notifications table
    op.drop_table('notifications') 