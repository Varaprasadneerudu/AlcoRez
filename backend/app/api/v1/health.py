from app.core.compliance import ComplianceEngine
from app.core.config import settings
from app.core.database import get_db
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

router = APIRouter(tags=["Health & Statutory Compliance"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {e!s}"

    return {
        "status": "online",
        "database": db_status,
        "environment": settings.ENVIRONMENT,
        "alcohol_transactions_enabled": settings.ALCOHOL_TRANSACTIONS_ENABLED,
        "demo_mode": settings.DEMO_MODE,
        "version": "1.0.0"
    }

@router.get("/compliance-status")
def compliance_status():
    """
    Public statutory disclosure endpoint informing consumers and regulators
    of platform compliance state under Telangana Excise laws.
    """
    return ComplianceEngine.get_compliance_posture()
