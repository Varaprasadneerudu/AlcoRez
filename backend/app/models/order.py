import enum
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Text, Boolean, Numeric, Integer, Enum, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import TimeStampedUUIDModel

class OrderStatus(str, enum.Enum):
    CREATED = "created"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    FAILED = "failed"

class Cart(TimeStampedUUIDModel):
    __tablename__ = "carts"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(TimeStampedUUIDModel):
    __tablename__ = "cart_items"

    cart_id: Mapped[str] = mapped_column(String(36), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_id: Mapped[str] = mapped_column(String(36), ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    cart = relationship("Cart", back_populates="items")
    inventory = relationship("Inventory", back_populates="cart_items")

class Order(TimeStampedUUIDModel):
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    retailer_id: Mapped[str] = mapped_column(String(36), ForeignKey("retailers.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.CREATED, nullable=False, index=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    taxes: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    address_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="orders")
    retailer = relationship("Retailer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("PaymentAttempt", back_populates="order", cascade="all, delete-orphan")

class OrderItem(TimeStampedUUIDModel):
    __tablename__ = "order_items"

    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("inventory.id", ondelete="SET NULL"), nullable=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str] = mapped_column(String(150), nullable=False)
    bottle_size: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")

class PaymentAttempt(TimeStampedUUIDModel):
    __tablename__ = "payment_attempts"

    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(50), default="SIMULATED_TEST_GATEWAY", nullable=False)
    transaction_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUCCESS", nullable=False)
    gateway_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    order = relationship("Order", back_populates="payments")
