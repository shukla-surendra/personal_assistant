"""add story points

Revision ID: 4979b15ffbac
Revises: fe088934351a
Create Date: 2026-09-06 10:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '4979b15ffbac'
down_revision = 'fe088934351a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('story_points', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'story_points')
