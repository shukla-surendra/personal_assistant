"""initial

Revision ID: 001
Create Date: 2024-03-21
"""

def upgrade():
    op.create_table(
        'users',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String()),
        sa.Column('status', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('user_id')
    )
    # ... other tables 