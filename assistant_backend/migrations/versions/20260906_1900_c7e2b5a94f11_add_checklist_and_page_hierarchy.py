"""add task checklist and page hierarchy

Revision ID: c7e2b5a94f11
Revises: a3f9c2e17d44
Create Date: 2026-09-06 19:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c7e2b5a94f11'
down_revision = 'a3f9c2e17d44'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('checklist', postgresql.JSONB(), nullable=True))
    op.add_column('pages', sa.Column('parent_page_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('pages.page_id', ondelete='SET NULL'), nullable=True))


def downgrade() -> None:
    op.drop_column('pages', 'parent_page_id')
    op.drop_column('tasks', 'checklist')
