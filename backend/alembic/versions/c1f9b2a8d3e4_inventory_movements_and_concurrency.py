"""inventory movements, concurrency versioning, and unique constraints

Revision ID: c1f9b2a8d3e4
Revises: baa9ac1eaa7f
Create Date: 2026-10-26 13:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'c1f9b2a8d3e4'
down_revision = 'baa9ac1eaa7f'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add version column and unique constraint to inventory
    with op.batch_alter_table('inventory', schema=None) as batch_op:
        batch_op.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_unique_constraint('uq_retailer_product_size', ['retailer_id', 'product_id', 'bottle_size'])

    # 2. Create inventory_movements table
    op.create_table(
        'inventory_movements',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('inventory_id', sa.String(length=36), nullable=False),
        sa.Column('retailer_id', sa.String(length=36), nullable=False),
        sa.Column('previous_quantity', sa.Integer(), nullable=False),
        sa.Column('new_quantity', sa.Integer(), nullable=False),
        sa.Column('change_quantity', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=100), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('actor_user_id', sa.String(length=36), nullable=True),
        sa.Column('actor_name', sa.String(length=150), nullable=True),
        sa.Column('actor_role', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['inventory_id'], ['inventory.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['retailer_id'], ['retailers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('inventory_movements', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_inventory_movements_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_inventory_movements_inventory_id'), ['inventory_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_inventory_movements_retailer_id'), ['retailer_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_inventory_movements_actor_user_id'), ['actor_user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_inventory_movements_created_at'), ['created_at'], unique=False)

def downgrade() -> None:
    with op.batch_alter_table('inventory_movements', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_inventory_movements_created_at'))
        batch_op.drop_index(batch_op.f('ix_inventory_movements_actor_user_id'))
        batch_op.drop_index(batch_op.f('ix_inventory_movements_retailer_id'))
        batch_op.drop_index(batch_op.f('ix_inventory_movements_inventory_id'))
        batch_op.drop_index(batch_op.f('ix_inventory_movements_id'))

    op.drop_table('inventory_movements')

    with op.batch_alter_table('inventory', schema=None) as batch_op:
        batch_op.drop_constraint('uq_retailer_product_size', type_='unique')
        batch_op.drop_column('version')
