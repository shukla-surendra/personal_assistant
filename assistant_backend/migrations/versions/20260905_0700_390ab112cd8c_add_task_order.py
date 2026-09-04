"""add task order

Revision ID: 390ab112cd8c
Revises: d1cfe575f302
Create Date: 2026-09-05 07:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '390ab112cd8c'
down_revision = 'd1cfe575f302'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('order', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'order')
