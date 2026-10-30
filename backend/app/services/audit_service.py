import json
from typing import Any

from app.models.compliance import AuditLog
from sqlalchemy.orm import Session


class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        entity_type: str,
        actor_user_id: str | None = None,
        actor_role: str | None = None,
        entity_id: str | None = None,
        ip_address: str | None = None,
        details: dict[str, Any] | None = None
    ) -> AuditLog:
        """Create an immutable audit log record for compliance and accountability."""
        details_str = json.dumps(details) if details is not None else None
        log_entry = AuditLog(
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
            details=details_str
        )
        db.add(log_entry)
        db.commit()
        return log_entry
