"""
Centralized Legal Compliance & Regulatory Enforcement Engine
Telangana Excise Act, 1968 & Applicable State Notifications
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.core.config import settings

class ComplianceViolationException(HTTPException):
    def __init__(self, detail: str, requirement_code: str = "EXCISE_COMPLIANCE_RESTRICTION"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "LegalComplianceRestriction",
                "code": requirement_code,
                "message": detail,
                "regulatory_context": (
                    "Under Telangana Excise Act, commercial alcohol delivery, online payment settlement, "
                    "and order dispatch require statutory licensing and state regulatory clearance. "
                    "Currently, the platform operates in DEMO / SIMULATION mode only."
                )
            }
        )

class ComplianceEngine:
    """
    Enforces fail-closed statutory and legal checks.
    """

    @classmethod
    def is_alcohol_transaction_enabled(cls) -> bool:
        """Fail-closed check for alcohol transaction processing."""
        return bool(settings.ALCOHOL_TRANSACTIONS_ENABLED)

    @classmethod
    def assert_real_payment_allowed(cls):
        """Disallows real payment processing if production alcohol transactions are not legally cleared."""
        if not cls.is_alcohol_transaction_enabled():
            raise ComplianceViolationException(
                detail="Real payment transactions for alcoholic beverages are legally prohibited without approved state excise clearance. Please use simulated test checkout.",
                requirement_code="PAYMENT_GATEWAY_PROHIBITED"
            )

    @classmethod
    def assert_alcohol_dispatch_allowed(cls):
        """Disallows actual alcohol order dispatch or doorstep delivery assignment."""
        if not cls.is_alcohol_transaction_enabled():
            raise ComplianceViolationException(
                detail="Alcohol home delivery dispatch is not legally approved under current Telangana retail wine shop guidelines.",
                requirement_code="HOME_DELIVERY_PROHIBITED"
            )

    @classmethod
    def validate_customer_age(cls, date_of_birth: Optional[str]) -> bool:
        """
        In Telangana, legal drinking and purchasing age is 21 years old.
        """
        if not date_of_birth:
            return False
        try:
            dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
            today = datetime.now(timezone.utc).date()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            return age >= 21
        except Exception:
            return False

    @classmethod
    def get_compliance_posture(cls) -> Dict[str, Any]:
        """Provides full statutory compliance posture report."""
        return {
            "alcohol_transactions_enabled": settings.ALCOHOL_TRANSACTIONS_ENABLED,
            "demo_mode": settings.DEMO_MODE,
            "jurisdiction": "Telangana, India",
            "governing_statute": "Telangana Excise Act, 1968",
            "statutory_minimum_age": 21,
            "doorstep_delivery_authorized": False,
            "real_payment_processing_authorized": False,
            "current_operating_mode": "SIMULATION_AND_DISCOVERY_ONLY",
            "fail_closed_active": True,
            "disclaimer": (
                "This platform is a prototype demonstration for product discovery and retail catalog information. "
                "No alcohol sales or real-world fulfillment are executed through this system."
            )
        }
