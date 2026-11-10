import enum
from datetime import date, datetime
from decimal import Decimal

from app.models.base import TimeStampedUUIDModel
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    RETAILER = "retailer"
    ADMIN = "admin"
    DELIVERY_PARTNER = "delivery_partner"

class User(TimeStampedUUIDModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    retailer = relationship("Retailer", back_populates="user", uselist=False)
    cart = relationship("Cart", back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders = relationship("Order", foreign_keys="[Order.user_id]", back_populates="user")
    delivery_orders = relationship("Order", foreign_keys="[Order.delivery_partner_id]", back_populates="delivery_partner")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    favorite_products = relationship("FavoriteProduct", back_populates="user", cascade="all, delete-orphan")
    favorite_retailers = relationship("FavoriteRetailer", back_populates="user", cascade="all, delete-orphan")
    delivery_profile = relationship("DeliveryPartnerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class CustomerProfile(TimeStampedUUIDModel):
    __tablename__ = "customer_profiles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    age_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    id_proof_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    id_proof_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    user = relationship("User", back_populates="customer_profile")

class Address(TimeStampedUUIDModel):
    __tablename__ = "addresses"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(50), default="Home", nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    landmark: Mapped[str | None] = mapped_column(String(150), nullable=True)
    city: Mapped[str] = mapped_column(String(100), default="Hyderabad", nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Telangana", nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[str | None] = mapped_column(String(50), nullable=True)
    longitude: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="addresses")


class DeliveryPartnerProfile(TimeStampedUUIDModel):
    __tablename__ = "delivery_partner_profiles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(50), default="Motorcycle", nullable=False)
    vehicle_number: Mapped[str] = mapped_column(String(50), default="TS 09 EB 4821", nullable=False)
    driving_license_number: Mapped[str] = mapped_column(String(100), default="DL-TS-2022-987654", nullable=False)
    is_online: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    current_zone: Mapped[str] = mapped_column(String(100), default="Madhapur & HITEC City", nullable=False)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("4.92"), nullable=False)
    total_trips: Mapped[int] = mapped_column(Integer, default=42, nullable=False)
    today_trips: Mapped[int] = mapped_column(Integer, default=6, nullable=False)
    today_earnings: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("620.00"), nullable=False)
    total_earnings: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("18450.00"), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    compliance_permit_no: Mapped[str] = mapped_column(String(100), default="TS-EXCISE-DP-2024-0982", nullable=False)

    user = relationship("User", back_populates="delivery_profile")


class RefreshToken(TimeStampedUUIDModel):
    __tablename__ = "refresh_tokens"

    token_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    replaced_by: Mapped[str | None] = mapped_column(String(64), nullable=True)

    user = relationship("User", back_populates="refresh_tokens")
