from datetime import datetime

from app.models.user import UserRole
from pydantic import BaseModel, ConfigDict, EmailStr


class UserUpdateAdmin(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    is_verified: bool | None = None

class ComplianceApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    requirement_code: str
    title: str
    legal_reference: str
    is_approved: bool
    approved_by_user_id: str | None = None
    approved_at: datetime | None = None
    notes: str | None = None

class ComplianceToggleRequest(BaseModel):
    requirement_code: str
    is_approved: bool
    notes: str | None = None

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_user_id: str | None = None
    actor_role: str | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    ip_address: str | None = None
    details: str | None = None
    timestamp: datetime

class AdminDashboardStats(BaseModel):
    total_users: int
    total_customers: int
    total_retailers: int
    pending_retailers: int
    approved_retailers: int
    suspended_retailers: int
    total_products: int
    total_inventory_items: int
    total_simulated_orders: int
    compliance_posture: dict[str, object]
