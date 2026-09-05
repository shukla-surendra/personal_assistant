"""add block order

Revision ID: 02ebc93e2bd7
Revises: 390ab112cd8c
Create Date: 2026-09-05 08:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '02ebc93e2bd7'
down_revision = '390ab112cd8c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('blocks', sa.Column('order', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('blocks', 'order')
