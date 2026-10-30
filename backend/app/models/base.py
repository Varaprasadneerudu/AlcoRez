import uuid
from datetime import datetime, timezone

from app.core.database import Base
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column


def generate_uuid() -> str:
    return str(uuid.uuid4())

class TimeStampedUUIDModel(Base):
    __abstract__ = True

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
