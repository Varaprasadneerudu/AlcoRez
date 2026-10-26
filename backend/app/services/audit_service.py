import json
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.compliance import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        entity_type: str,
        actor_user_id: Optional[str] = None,
        actor_role: Optional[str] = None,
        entity_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
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
        db.refresh(log_entry)
        return log_entry
