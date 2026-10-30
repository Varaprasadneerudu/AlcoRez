import enum
from datetime import date

from app.models.base import TimeStampedUUIDModel
from sqlalchemy import Boolean, Date, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    RETAILER = "retailer"
    ADMIN = "admin"

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
    orders = relationship("Order", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    favorite_products = relationship("FavoriteProduct", back_populates="user", cascade="all, delete-orphan")
    favorite_retailers = relationship("FavoriteRetailer", back_populates="user", cascade="all, delete-orphan")


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
