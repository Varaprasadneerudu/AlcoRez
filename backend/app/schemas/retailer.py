from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.retailer import RetailerStatus

class RetailerApplicationCreate(BaseModel):
    shop_name: str = Field(..., min_length=3, max_length=255)
    trade_name: Optional[str] = None
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
    document_url: Optional[str] = "https://mock-storage.telangana.gov/licenses/sample-a4-license.pdf"
    existing_retailer_id: Optional[str] = None # Optional ID of existing store to associate with

class RetailerLicenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    license_number: str
    license_type: str
    issuing_authority: str
    issued_date: date
    expiry_date: date
    is_verified: bool
    verified_at: Optional[datetime] = None
    document_url: Optional[str] = None

class RetailerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    shop_name: str
    trade_name: Optional[str] = None
    contact_person: str
    phone: str
    email: str
    address_line: str
    city: str
    state: str
    postal_code: str
    status: RetailerStatus
    review_notes: Optional[str] = None
    created_at: datetime
    license: Optional[RetailerLicenseOut] = None
    last_inventory_update: Optional[datetime] = None
    active_products_count: Optional[int] = 0

class RetailerReviewRequest(BaseModel):
    status: RetailerStatus = Field(..., description="approved, rejected, or suspended")
    review_notes: Optional[str] = None
    verify_license: bool = True

from app.schemas.catalog import InventoryMovementOut

class RetailerDashboardOut(BaseModel):
    retailer: RetailerOut
    total_listings: int
    active_inventory_count: int
    low_stock_count: int
    out_of_stock_count: int = 0
    total_units: int = 0
    test_orders_count: int
    compliance_status: str
    license_days_remaining: Optional[int] = None
    is_license_expired: bool = False
    is_license_expiring_soon: bool = False
    recent_movements: List[InventoryMovementOut] = []
