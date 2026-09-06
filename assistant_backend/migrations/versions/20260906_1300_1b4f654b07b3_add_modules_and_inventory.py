"""add module registry and inventory module

Revision ID: 1b4f654b07b3
Revises: 4979b15ffbac
Create Date: 2026-09-06 13:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1b4f654b07b3'
down_revision = '4979b15ffbac'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'workspace_modules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('module_key', sa.String(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('enabled_at', sa.DateTime(), nullable=True),
        sa.Column('enabled_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('workspace_id', 'module_key', name='uq_workspace_module'),
    )

    op.create_table(
        'inv_warehouses',
        sa.Column('warehouse_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'inv_products',
        sa.Column('product_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('sku', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('unit', sa.String(), nullable=False, server_default='pcs'),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('reorder_level', sa.Integer(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'inv_stock_movements',
        sa.Column('movement_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.workspace_id', ondelete='CASCADE'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('inv_products.product_id', ondelete='CASCADE'), nullable=False),
        sa.Column('warehouse_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('inv_warehouses.warehouse_id', ondelete='CASCADE'), nullable=False),
        sa.Column('movement_type', sa.String(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('reference', sa.String(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('inv_stock_movements')
    op.drop_table('inv_products')
    op.drop_table('inv_warehouses')
    op.drop_table('workspace_modules')
