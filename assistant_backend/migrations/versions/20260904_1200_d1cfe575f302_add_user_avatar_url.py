"""add user avatar_url

Revision ID: d1cfe575f302
Revises: 6ecbd91fcc55
Create Date: 2026-09-04 12:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd1cfe575f302'
down_revision = '6ecbd91fcc55'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'avatar_url')
