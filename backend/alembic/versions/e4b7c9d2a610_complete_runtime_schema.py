"""Add runtime auth, invitation, and simulated delivery schema.

Revision ID: e4b7c9d2a610
Revises: d2e8a1b3c4f5
"""

import sqlalchemy as sa
from alembic import op

revision = "e4b7c9d2a610"
down_revision = "d2e8a1b3c4f5"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def _has_index(table: str, name: str) -> bool:
    return any(index["name"] == name for index in sa.inspect(op.get_bind()).get_indexes(table))


def _create_index_if_missing(table: str, name: str, columns: list[str], unique: bool = False) -> None:
    if not _has_index(table, name):
        op.create_index(name, table, columns, unique=unique)


def _common_columns() -> list[sa.Column]:
    return [
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    ]


def upgrade() -> None:
    dialect = op.get_bind().dialect.name
    if dialect == "postgresql":
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'DELIVERY_PARTNER'")
        op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY'")

    if not _has_table("delivery_partner_profiles"):
        op.create_table(
            "delivery_partner_profiles",
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
            sa.Column("vehicle_type", sa.String(50), nullable=False),
            sa.Column("vehicle_number", sa.String(50), nullable=False),
            sa.Column("driving_license_number", sa.String(100), nullable=False),
            sa.Column("is_online", sa.Boolean(), nullable=False),
            sa.Column("current_zone", sa.String(100), nullable=False),
            sa.Column("rating", sa.Numeric(3, 2), nullable=False),
            sa.Column("total_trips", sa.Integer(), nullable=False),
            sa.Column("today_trips", sa.Integer(), nullable=False),
            sa.Column("today_earnings", sa.Numeric(10, 2), nullable=False),
            sa.Column("total_earnings", sa.Numeric(10, 2), nullable=False),
            sa.Column("is_verified", sa.Boolean(), nullable=False),
            sa.Column("compliance_permit_no", sa.String(100), nullable=False),
            *_common_columns(),
        )
    _create_index_if_missing("delivery_partner_profiles", "ix_delivery_partner_profiles_id", ["id"])

    if not _has_table("refresh_tokens"):
        op.create_table(
            "refresh_tokens",
            sa.Column("token_id", sa.String(64), nullable=False),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("is_revoked", sa.Boolean(), nullable=False),
            sa.Column("revoked_at", sa.DateTime(), nullable=True),
            sa.Column("replaced_by", sa.String(64), nullable=True),
            *_common_columns(),
        )
    for name, columns, unique in (
        ("ix_refresh_tokens_id", ["id"], False),
        ("ix_refresh_tokens_token_id", ["token_id"], True),
        ("ix_refresh_tokens_user_id", ["user_id"], False),
        ("ix_refresh_tokens_expires_at", ["expires_at"], False),
        ("ix_refresh_tokens_is_revoked", ["is_revoked"], False),
    ):
        _create_index_if_missing("refresh_tokens", name, columns, unique)

    if not _has_table("retailer_invitations"):
        op.create_table(
            "retailer_invitations",
            sa.Column("retailer_id", sa.String(36), sa.ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False),
            sa.Column("code", sa.String(100), nullable=False),
            sa.Column("invited_email", sa.String(255), nullable=True),
            sa.Column("created_by_user_id", sa.String(36), nullable=False),
            sa.Column("role_in_retailer", sa.String(50), nullable=False),
            sa.Column("is_used", sa.Boolean(), nullable=False),
            sa.Column("used_by_user_id", sa.String(36), nullable=True),
            sa.Column("expires_at", sa.DateTime(), nullable=True),
            *_common_columns(),
        )
    for name, columns, unique in (
        ("ix_retailer_invitations_id", ["id"], False),
        ("ix_retailer_invitations_code", ["code"], True),
        ("ix_retailer_invitations_retailer_id", ["retailer_id"], False),
        ("ix_retailer_invitations_is_used", ["is_used"], False),
    ):
        _create_index_if_missing("retailer_invitations", name, columns, unique)

    order_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("orders")}
    if "delivery_partner_id" not in order_columns:
        column = sa.Column("delivery_partner_id", sa.String(36), nullable=True)
        if dialect == "postgresql":
            column.append_foreign_key(sa.ForeignKey("users.id", ondelete="SET NULL"))
        op.add_column("orders", column)
    if "delivery_otp" not in order_columns:
        op.add_column("orders", sa.Column("delivery_otp", sa.String(6), nullable=True))
    _create_index_if_missing("orders", "ix_orders_delivery_partner_id", ["delivery_partner_id"])

    for table, name, columns in (
        ("inventory", "ix_inventory_bottle_size", ["bottle_size"]),
        ("inventory", "ix_inventory_is_available", ["is_available"]),
        ("inventory", "ix_inventory_price", ["price"]),
        ("product_images", "ix_product_images_is_primary", ["is_primary"]),
        ("products", "ix_products_is_active", ["is_active"]),
    ):
        _create_index_if_missing(table, name, columns)

    if dialect == "sqlite":
        # The original SQLite migration used short VARCHAR representations of
        # the enums. Widen them for the added values and restore the order FK.
        with op.batch_alter_table("users") as batch:
            batch.alter_column(
                "role", existing_type=sa.String(8),
                type_=sa.Enum("CUSTOMER", "RETAILER", "ADMIN", "DELIVERY_PARTNER", name="userrole"),
                existing_nullable=False,
            )
        foreign_keys = sa.inspect(op.get_bind()).get_foreign_keys("orders")
        has_delivery_fk = any(fk["constrained_columns"] == ["delivery_partner_id"] for fk in foreign_keys)
        with op.batch_alter_table("orders") as batch:
            batch.alter_column(
                "status", existing_type=sa.String(9),
                type_=sa.Enum(
                    "CREATED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY",
                    "COMPLETED", "REJECTED", "CANCELLED", "FAILED", name="orderstatus",
                ),
                existing_nullable=False,
            )
            if not has_delivery_fk:
                batch.create_foreign_key(
                    "fk_orders_delivery_partner_id_users", "users", ["delivery_partner_id"], ["id"],
                    ondelete="SET NULL",
                )


def downgrade() -> None:
    raise NotImplementedError("Downgrading this data-bearing schema requires a planned data migration.")
