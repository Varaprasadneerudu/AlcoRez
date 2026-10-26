from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class ProductImageOut(BaseModel):
    id: str
    image_url: str
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)

class InventoryOut(BaseModel):
    id: str
    retailer_id: str
    product_id: str
    bottle_size: str
    price: Decimal
    stock_quantity: int
    is_available: bool
    low_stock_threshold: int = 5
    version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    retailer_shop_name: Optional[str] = None
    retailer_status: Optional[str] = None
    retailer_address: Optional[str] = None
    product_name: Optional[str] = None
    product_brand: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    primary_image_url: Optional[str] = None
    alcohol_by_volume: Optional[str] = None
    country_of_origin: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class InventoryCreate(BaseModel):
    product_id: str
    bottle_size: str = Field(..., description="e.g. 750ml, 375ml, 180ml, 650ml")
    price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    is_available: bool = True
    low_stock_threshold: int = Field(default=5, ge=0)

class InventoryUpdate(BaseModel):
    bottle_size: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_available: Optional[bool] = None
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    expected_version: Optional[int] = None

class StockAdjustmentRequest(BaseModel):
    new_quantity: int = Field(..., ge=0, description="New absolute quantity")
    reason: str = Field(..., min_length=2, max_length=100, description="Reason: Restock, Damaged, Count Audit, etc.")
    notes: Optional[str] = Field(None, max_length=500)
    expected_version: Optional[int] = None

class InventoryMovementOut(BaseModel):
    id: str
    inventory_id: str
    retailer_id: str
    previous_quantity: int
    new_quantity: int
    change_quantity: int
    reason: str
    notes: Optional[str] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InventorySummaryOut(BaseModel):
    total_listings: int
    in_stock_listings: int
    low_stock_listings: int
    out_of_stock_listings: int
    inactive_listings: int
    total_units: int

class PaginatedInventoryResponse(BaseModel):
    items: List[InventoryOut]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary: InventorySummaryOut
    categories: List[CategoryOut] = []
    brands: List[str] = []

class ProductOut(BaseModel):
    id: str
    name: str
    brand: str
    category_id: str
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    description: Optional[str] = None
    alcohol_by_volume: Optional[str] = None
    country_of_origin: str
    is_active: bool
    is_demo_data: bool
    primary_image_url: Optional[str] = None
    starting_price: Optional[Decimal] = None
    available_sizes: List[str] = []
    in_stock: bool = False

    model_config = ConfigDict(from_attributes=True)

class ProductDetailOut(BaseModel):
    id: str
    name: str
    brand: str
    category_id: str
    category_name: Optional[str] = None
    description: Optional[str] = None
    alcohol_by_volume: Optional[str] = None
    country_of_origin: str
    is_active: bool
    is_demo_data: bool
    images: List[ProductImageOut] = []
    inventories: List[InventoryOut] = []
    compliance_notice: str = (
        "Demonstration product listing. Regulated alcoholic beverage under Telangana Excise Laws. "
        "Online home delivery and commercial order fulfillment are disabled."
    )

    model_config = ConfigDict(from_attributes=True)

class ProductCreate(BaseModel):
    name: str
    brand: str
    category_id: str
    description: Optional[str] = None
    alcohol_by_volume: Optional[str] = None
    country_of_origin: str = "India"
    image_url: Optional[str] = None
    bottle_size: str = "750ml"
    price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(default=10, ge=0)
