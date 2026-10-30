import enum
from datetime import date, datetime

from app.models.base import TimeStampedUUIDModel
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class RetailerStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
    EXPIRED = "expired"

class Retailer(TimeStampedUUIDModel):
    __tablename__ = "retailers"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    shop_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    trade_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Hyderabad", nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Telangana", nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    latitude: Mapped[str | None] = mapped_column(String(50), nullable=True)
    longitude: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[RetailerStatus] = mapped_column(Enum(RetailerStatus), default=RetailerStatus.PENDING_REVIEW, nullable=False, index=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="retailer")
    licenses = relationship("RetailerLicense", back_populates="retailer", cascade="all, delete-orphan")
    memberships = relationship("RetailerMembership", back_populates="retailer", cascade="all, delete-orphan")
    inventories = relationship("Inventory", back_populates="retailer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="retailer")

class RetailerLicense(TimeStampedUUIDModel):
    __tablename__ = "retailer_licenses"

    retailer_id: Mapped[str] = mapped_column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    license_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    license_type: Mapped[str] = mapped_column(String(100), default="A4 Retail Wine Shop", nullable=False)
    issuing_authority: Mapped[str] = mapped_column(String(150), default="Prohibition & Excise Department, Govt of Telangana", nullable=False)
    issued_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    document_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    verified_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    retailer = relationship("Retailer", back_populates="licenses")

class RetailerMembership(TimeStampedUUIDModel):
    __tablename__ = "retailer_memberships"

    retailer_id: Mapped[str] = mapped_column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_in_retailer: Mapped[str] = mapped_column(String(50), default="OWNER", nullable=False)

    retailer = relationship("Retailer", back_populates="memberships")
