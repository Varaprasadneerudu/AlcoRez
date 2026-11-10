from datetime import date, datetime

from app.models.retailer import RetailerStatus
from app.schemas.catalog import InventoryMovementOut
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RetailerApplicationCreate(BaseModel):
    shop_name: str = Field(..., min_length=3, max_length=255)
    trade_name: str | None = None
    contact_person: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=10, max_length=15)
    email: EmailStr
    address_line: str = Field(..., min_length=5, max_length=255)
    city: str = "Hyderabad"
    state: str = "Telangana"
    postal_code: str = Field(..., min_length=6, max_length=10)
    # License particulars
    license_number: str = Field(..., min_length=5, max_length=100, description="e.g., TS-HYD-A4-2024-0891")
    license_type: str = Field(default="A4 Retail Wine Shop", description="A4 Wine Shop, 2B Bar & Restaurant, etc.")
    issuing_authority: str = Field(default="Prohibition & Excise Department, Govt of Telangana")
    issued_date: date
    expiry_date: date
    document_url: str | None = "https://mock-storage.telangana.gov/licenses/sample-a4-license.pdf"
    existing_retailer_id: str | None = None # Optional ID of existing store to associate with
    invitation_code: str | None = None # Required when existing_retailer_id is specified

class RetailerLicenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    license_number: str
    license_type: str
    issuing_authority: str
    issued_date: date
    expiry_date: date
    is_verified: bool
    verified_at: datetime | None = None
    document_url: str | None = None

class RetailerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    shop_name: str
    trade_name: str | None = None
    contact_person: str
    phone: str
    email: str
    address_line: str
    city: str
    state: str
    postal_code: str
    status: RetailerStatus
    review_notes: str | None = None
    created_at: datetime
    license: RetailerLicenseOut | None = None
    last_inventory_update: datetime | None = None
    active_products_count: int | None = 0

class RetailerReviewRequest(BaseModel):
    status: RetailerStatus = Field(..., description="approved, rejected, or suspended")
    review_notes: str | None = None
    verify_license: bool = True

class RetailerDashboardOut(BaseModel):
    retailer: RetailerOut
    total_listings: int
    active_inventory_count: int
    low_stock_count: int
    out_of_stock_count: int = 0
    total_units: int = 0
    test_orders_count: int
    compliance_status: str
    license_days_remaining: int | None = None
    is_license_expired: bool = False
    is_license_expiring_soon: bool = False
    recent_movements: list[InventoryMovementOut] = []

class RetailerInvitationCreate(BaseModel):
    invited_email: EmailStr | None = None
    role_in_retailer: str = Field(default="STAFF", description="STAFF or MANAGER")
    expires_in_days: int = Field(default=7, ge=1, le=30)

class RetailerInvitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    retailer_id: str
    code: str
    invited_email: str | None = None
    role_in_retailer: str
    is_used: bool
    expires_at: datetime | None = None
    created_at: datetime
