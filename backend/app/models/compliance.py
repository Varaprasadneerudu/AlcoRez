from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import TimeStampedUUIDModel, generate_uuid
from app.core.database import Base

class ComplianceApproval(TimeStampedUUIDModel):
    __tablename__ = "compliance_approvals"

    requirement_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_reference: Mapped[str] = mapped_column(Text, nullable=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    approved_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class ServiceArea(TimeStampedUUIDModel):
    __tablename__ = "service_areas"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Hyderabad", nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Telangana", nullable=False)
    postal_codes: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class Notification(TimeStampedUUIDModel):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), default="INFO", nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid, index=True)
    actor_user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    actor_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
