from decimal import Decimal

from app.models.base import TimeStampedUUIDModel
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Category(TimeStampedUUIDModel):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    products = relationship("Product", back_populates="category")

class Product(TimeStampedUUIDModel):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    alcohol_by_volume: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country_of_origin: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    inventories = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")

class ProductImage(TimeStampedUUIDModel):
    __tablename__ = "product_images"

    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    product = relationship("Product", back_populates="images")

class Inventory(TimeStampedUUIDModel):
    __tablename__ = "inventory"
    __table_args__ = (
        UniqueConstraint("retailer_id", "product_id", "bottle_size", name="uq_retailer_product_size"),
        CheckConstraint("stock_quantity >= 0", name="ck_inventory_stock_non_negative"),
    )

    retailer_id: Mapped[str] = mapped_column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    bottle_size: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, index=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    retailer = relationship("Retailer", back_populates="inventories")
    product = relationship("Product", back_populates="inventories")
    cart_items = relationship("CartItem", back_populates="inventory")
    movements = relationship("InventoryMovement", back_populates="inventory", cascade="all, delete-orphan", order_by="desc(InventoryMovement.created_at)")

class InventoryMovement(TimeStampedUUIDModel):
    __tablename__ = "inventory_movements"

    inventory_id: Mapped[str] = mapped_column(String(36), ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    retailer_id: Mapped[str] = mapped_column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    new_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    change_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    actor_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(50), nullable=True)

    inventory = relationship("Inventory", back_populates="movements")
    retailer = relationship("Retailer")
    actor = relationship("User")
