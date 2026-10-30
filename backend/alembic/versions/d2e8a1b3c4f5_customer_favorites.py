"""customer favorites for products and retailers

Revision ID: d2e8a1b3c4f5
Revises: c1f9b2a8d3e4
Create Date: 2026-10-28 12:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'd2e8a1b3c4f5'
down_revision = 'c1f9b2a8d3e4'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Favorite Products
    op.create_table(
        'favorite_products',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'product_id', name='uq_user_product_favorite')
    )
    with op.batch_alter_table('favorite_products', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_favorite_products_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_favorite_products_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_favorite_products_product_id'), ['product_id'], unique=False)

    # 2. Favorite Retailers
    op.create_table(
        'favorite_retailers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('retailer_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['retailer_id'], ['retailers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'retailer_id', name='uq_user_retailer_favorite')
    )
    with op.batch_alter_table('favorite_retailers', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_favorite_retailers_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_favorite_retailers_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_favorite_retailers_retailer_id'), ['retailer_id'], unique=False)

def downgrade() -> None:
    with op.batch_alter_table('favorite_retailers', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_favorite_retailers_retailer_id'))
        batch_op.drop_index(batch_op.f('ix_favorite_retailers_user_id'))
        batch_op.drop_index(batch_op.f('ix_favorite_retailers_id'))
    op.drop_table('favorite_retailers')

    with op.batch_alter_table('favorite_products', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_favorite_products_product_id'))
        batch_op.drop_index(batch_op.f('ix_favorite_products_user_id'))
        batch_op.drop_index(batch_op.f('ix_favorite_products_id'))
    op.drop_table('favorite_products')
