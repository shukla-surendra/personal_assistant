"""merge heads

Revision ID: merge_heads
Revises: 001, 20240420_alter_task_priority
Create Date: 2024-04-20 17:30:00.000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_heads'
down_revision = ('001', '20240420_alter_task_priority')
branch_labels = None
depends_on = None


def upgrade():
    # This is an empty migration that just merges the heads
    pass


def downgrade():
    # This is an empty migration that just merges the heads
    pass 