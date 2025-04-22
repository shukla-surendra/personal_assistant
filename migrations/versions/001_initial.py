"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create enum types if they don't exist
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE user_status AS ENUM ('active', 'inactive');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        
        DO $$ BEGIN
            CREATE TYPE user_roles AS ENUM ('admin', 'user');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        
        DO $$ BEGIN
            CREATE TYPE user_type AS ENUM ('free', 'premium');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        
        DO $$ BEGIN
            CREATE TYPE task_type AS ENUM ('todo', 'notes', 'quick_note', 'time_block');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        
        DO $$ BEGIN
            CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create users table
    op.create_table(
        'users',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('password_hash', sa.String()),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String()),
        sa.Column('country_code', sa.String(10)),
        sa.Column('mobile_number', sa.String(20)),
        sa.Column('google_id', sa.String()),
        sa.Column('last_login', sa.DateTime(timezone=True)),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('role', sa.String(), nullable=False, server_default='user'),
        sa.Column('user_type', sa.String(), nullable=False, server_default='free'),
        sa.Column('preferences', postgresql.JSON, server_default='{}'),
        sa.Column('is_deleted', sa.Boolean(), server_default='false'),
        sa.Column('is_email_verified', sa.Boolean(), server_default='false'),
        sa.Column('is_phone_verified', sa.Boolean(), server_default='false'),
        sa.Column('verification_token', sa.String()),
        sa.Column('otp', sa.String(6)),
        sa.Column('otp_time', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create workspaces table
    op.create_table(
        'workspaces',
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('settings', postgresql.JSON, server_default='{}'),
        sa.Column('meta_data', postgresql.JSON, server_default='{}'),
        sa.Column('system_default', sa.Boolean(), server_default='false'),
        sa.Column('is_default', sa.Boolean(), server_default='false'),
        sa.Column('is_deleted', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create boards table
    op.create_table(
        'boards',
        sa.Column('board_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('labels', postgresql.JSON, server_default='[]'),
        sa.Column('settings', postgresql.JSON, server_default='{}'),
        sa.Column('meta_data', postgresql.JSON, server_default='{}'),
        sa.Column('status', sa.String(), server_default='active'),
        sa.Column('is_deleted', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('task_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id'), nullable=False),
        sa.Column('board_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('boards.board_id')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('priority', sa.Integer()),
        sa.Column('task_type', sa.String(), nullable=False, server_default='todo'),
        sa.Column('status', sa.String(), nullable=False, server_default='todo'),
        sa.Column('completed', sa.Boolean(), server_default='false'),
        sa.Column('is_deleted', sa.Boolean(), server_default='false'),
        sa.Column('due_on', sa.DateTime(timezone=True)),
        sa.Column('start_time', sa.DateTime(timezone=True)),
        sa.Column('end_time', sa.DateTime(timezone=True)),
        sa.Column('assignee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id')),
        sa.Column('reporter_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id')),
        sa.Column('watchers', postgresql.JSON, server_default='[]'),
        sa.Column('labels', postgresql.JSON, server_default='[]'),
        sa.Column('meta_data', postgresql.JSON, server_default='{}'),
        sa.Column('settings', postgresql.JSON, server_default='{}'),
        sa.Column('published', sa.Boolean(), server_default='false'),
        sa.Column('public', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_tasks_workspace', 'tasks', ['workspace_id'])
    op.create_index('idx_tasks_board', 'tasks', ['board_id'])
    op.create_index('idx_tasks_assignee', 'tasks', ['assignee_id'])
    op.create_index('idx_boards_workspace', 'boards', ['workspace_id'])

def downgrade() -> None:
    # Drop tables
    op.drop_table('tasks')
    op.drop_table('boards')
    op.drop_table('workspaces')
    op.drop_table('users')

    # Drop enum types
    op.execute('DROP TYPE IF EXISTS task_status')
    op.execute('DROP TYPE IF EXISTS task_type')
    op.execute('DROP TYPE IF EXISTS user_type')
    op.execute('DROP TYPE IF EXISTS user_roles')
    op.execute('DROP TYPE IF EXISTS user_status') 