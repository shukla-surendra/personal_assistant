"""add board items table

Revision ID: 20240321_add_board_items_table
Revises: 20240321_add_time_block_to_tasktype
Create Date: 2024-03-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20240321_add_board_items_table'
down_revision: Union[str, None] = '20240321_add_time_block_to_tasktype'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create board_items table
    op.create_table(
        'board_items',
        sa.Column('item_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('board_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String, nullable=False),
        sa.Column('description', sa.String),
        sa.Column('status', sa.String),
        sa.Column('assignee_id', postgresql.UUID(as_uuid=True)),
        sa.Column('due_date', sa.DateTime(timezone=True)),
        sa.Column('properties', postgresql.JSONB, server_default='{}'),
        sa.Column('order', sa.Integer, server_default='0'),
        sa.Column('is_deleted', sa.Boolean, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['board_id'], ['boards.board_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.user_id'], ondelete='SET NULL')
    )

    # Create index on board_id for faster lookups
    op.create_index('ix_board_items_board_id', 'board_items', ['board_id'])


def downgrade() -> None:
    # Drop the board_items table
    op.drop_table('board_items') 