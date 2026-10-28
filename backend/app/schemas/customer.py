from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class CustomerProfileOut(BaseModel):
    id: str
    user_id: str
    date_of_birth: Optional[date] = None
    age_verified: bool
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CustomerProfileUpdate(BaseModel):
    date_of_birth: Optional[date] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None

class AddressCreate(BaseModel):
    label: str = Field(default="Home", description="Home, Work, or Other")
    address_line1: str = Field(..., min_length=3, max_length=255)
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str = "Hyderabad"
    state: str = "Telangana"
    postal_code: str = Field(..., min_length=6, max_length=10)
    is_default: bool = False

class AddressOut(BaseModel):
    id: str
    user_id: str
    label: str
    address_line1: str
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    state: str
    postal_code: str
    is_default: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from typing import List
from app.schemas.catalog import ProductOut
from app.schemas.retailer import RetailerOut

class FavoriteProductOut(BaseModel):
    id: str
    product_id: str
    created_at: datetime
    product: ProductOut

    model_config = ConfigDict(from_attributes=True)

class FavoriteRetailerOut(BaseModel):
    id: str
    retailer_id: str
    created_at: datetime
    retailer: RetailerOut

    model_config = ConfigDict(from_attributes=True)

class CustomerFavoritesOut(BaseModel):
    products: List[FavoriteProductOut] = []
    retailers: List[FavoriteRetailerOut] = []

class FavoriteIdsOut(BaseModel):
    product_ids: List[str] = []
    retailer_ids: List[str] = []

