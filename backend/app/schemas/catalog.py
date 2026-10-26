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
    retailer_shop_name: Optional[str] = None
    retailer_status: Optional[str] = None
    retailer_address: Optional[str] = None

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
