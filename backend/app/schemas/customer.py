from datetime import date, datetime

from app.schemas.catalog import ProductOut
from app.schemas.retailer import RetailerOut
from pydantic import BaseModel, ConfigDict, Field


class CustomerProfileOut(BaseModel):
    id: str
    user_id: str
    date_of_birth: date | None = None
    age_verified: bool
    id_proof_type: str | None = None
    id_proof_number: str | None = None

    model_config = ConfigDict(from_attributes=True)

class CustomerProfileUpdate(BaseModel):
    date_of_birth: date | None = None
    id_proof_type: str | None = None
    id_proof_number: str | None = None

class AddressCreate(BaseModel):
    label: str = Field(default="Home", description="Home, Work, or Other")
    address_line1: str = Field(..., min_length=3, max_length=255)
    address_line2: str | None = None
    landmark: str | None = None
    city: str = "Hyderabad"
    state: str = "Telangana"
    postal_code: str = Field(..., min_length=6, max_length=10)
    is_default: bool = False

class AddressOut(BaseModel):
    id: str
    user_id: str
    label: str
    address_line1: str
    address_line2: str | None = None
    landmark: str | None = None
    city: str
    state: str
    postal_code: str
    is_default: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


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
    products: list[FavoriteProductOut] = []
    retailers: list[FavoriteRetailerOut] = []

class FavoriteIdsOut(BaseModel):
    product_ids: list[str] = []
    retailer_ids: list[str] = []

