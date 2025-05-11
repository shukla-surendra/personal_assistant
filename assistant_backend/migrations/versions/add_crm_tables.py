"""add crm tables

Revision ID: add_crm_tables
Revises: 
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_crm_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create contacts table
    op.create_table(
        'contacts',
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id'), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('job_title', sa.String(), nullable=True),
        sa.Column('address', postgresql.JSONB(), nullable=True),
        sa.Column('social_media', postgresql.JSONB(), nullable=True),
        sa.Column('tags', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('properties', postgresql.JSONB(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create deals table
    op.create_table(
        'deals',
        sa.Column('deal_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.contact_id'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('value', sa.Integer(), nullable=True),
        sa.Column('currency', sa.String(), nullable=True, server_default='USD'),
        sa.Column('stage', sa.String(), nullable=False),
        sa.Column('probability', sa.Integer(), nullable=True),
        sa.Column('expected_close_date', sa.DateTime(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('properties', postgresql.JSONB(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create contact_activities table
    op.create_table(
        'contact_activities',
        sa.Column('activity_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.contact_id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('properties', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create deal_activities table
    op.create_table(
        'deal_activities',
        sa.Column('activity_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id'), nullable=False),
        sa.Column('deal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deals.deal_id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('old_stage', sa.String(), nullable=True),
        sa.Column('new_stage', sa.String(), nullable=True),
        sa.Column('properties', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

def downgrade():
    op.drop_table('deal_activities')
    op.drop_table('contact_activities')
    op.drop_table('deals')
    op.drop_table('contacts') 