"""add companies and deal order

Revision ID: e22a451be51c
Revises: c99039bb0752
Create Date: 2026-09-06 16:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e22a451be51c'
down_revision = 'c99039bb0752'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'companies',
        sa.Column('company_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('industry', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('size', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('address', postgresql.JSONB(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.JSONB(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.add_column('contacts', sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.company_id', ondelete='SET NULL'), nullable=True))
    op.add_column('deals', sa.Column('order', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('deals', 'order')
    op.drop_column('contacts', 'company_id')
    op.drop_table('companies')
