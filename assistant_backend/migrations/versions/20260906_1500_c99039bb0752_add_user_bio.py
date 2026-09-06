"""add user bio

Revision ID: c99039bb0752
Revises: 1b4f654b07b3
Create Date: 2026-09-06 15:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c99039bb0752'
down_revision = '1b4f654b07b3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('bio', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'bio')
