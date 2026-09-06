"""add hr module

Revision ID: d4a8f21c9b33
Revises: c7e2b5a94f11
Create Date: 2026-09-06 20:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd4a8f21c9b33'
down_revision = 'c7e2b5a94f11'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'hr_employees',
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('job_title', sa.String(), nullable=True),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('employment_type', sa.String(), nullable=False, server_default='full_time'),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('manager_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('leave_allocations', postgresql.JSONB(), nullable=True),
        sa.Column('onboarding_checklist', postgresql.JSONB(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    # Self-referential FK added after table creation (can't reference the
    # table's own primary key column within the same CREATE TABLE call).
    op.create_foreign_key(
        'fk_hr_employees_manager', 'hr_employees', 'hr_employees',
        ['manager_id'], ['employee_id'], ondelete='SET NULL'
    )

    op.create_table(
        'hr_leave_requests',
        sa.Column('leave_request_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hr_employees.employee_id', ondelete='CASCADE'), nullable=False),
        sa.Column('leave_type', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('days', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('hr_employees.employee_id', ondelete='SET NULL'), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('review_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'hr_onboarding_templates',
        sa.Column('template_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('items', postgresql.JSONB(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('hr_onboarding_templates')
    op.drop_table('hr_leave_requests')
    op.drop_constraint('fk_hr_employees_manager', 'hr_employees', type_='foreignkey')
    op.drop_table('hr_employees')
