"""alter task priority

Revision ID: 20240420_alter_task_priority
Revises: 
Create Date: 2024-04-20 16:57:09.334

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20240420_alter_task_priority'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create a temporary column
    op.add_column('tasks', sa.Column('priority_temp', sa.String(), nullable=True))
    
    # Update the temporary column with string values based on the integer values
    op.execute("""
        UPDATE tasks 
        SET priority_temp = CASE 
            WHEN priority = 1 THEN 'low'
            WHEN priority = 2 THEN 'medium'
            WHEN priority = 3 THEN 'high'
            ELSE 'medium'
        END
    """)
    
    # Drop the old column
    op.drop_column('tasks', 'priority')
    
    # Rename the temporary column
    op.alter_column('tasks', 'priority_temp', new_column_name='priority', nullable=False)


def downgrade():
    # Create a temporary column
    op.add_column('tasks', sa.Column('priority_temp', sa.Integer(), nullable=True))
    
    # Update the temporary column with integer values based on the string values
    op.execute("""
        UPDATE tasks 
        SET priority_temp = CASE 
            WHEN priority = 'low' THEN 1
            WHEN priority = 'medium' THEN 2
            WHEN priority = 'high' THEN 3
            ELSE 2
        END
    """)
    
    # Drop the old column
    op.drop_column('tasks', 'priority')
    
    # Rename the temporary column
    op.alter_column('tasks', 'priority_temp', new_column_name='priority', nullable=False) 