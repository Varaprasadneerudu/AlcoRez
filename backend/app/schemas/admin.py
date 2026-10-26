from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from app.models.user import UserRole

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class ComplianceApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    requirement_code: str
    title: str
    legal_reference: str
    is_approved: bool
    approved_by_user_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None

class ComplianceToggleRequest(BaseModel):
    requirement_code: str
    is_approved: bool
    notes: Optional[str] = None

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_user_id: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
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
    compliance_posture: Dict[str, object]
