from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    image_url: str | None = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    image_url: str | None = None

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
    created_at: datetime | None = None
    updated_at: datetime | None = None
    retailer_shop_name: str | None = None
    retailer_status: str | None = None
    retailer_address: str | None = None
    product_name: str | None = None
    product_brand: str | None = None
    category_id: str | None = None
    category_name: str | None = None
    category_slug: str | None = None
    primary_image_url: str | None = None
    alcohol_by_volume: str | None = None
    country_of_origin: str | None = None

    model_config = ConfigDict(from_attributes=True)

class InventoryCreate(BaseModel):
    product_id: str
    bottle_size: str = Field(..., description="e.g. 750ml, 375ml, 180ml, 650ml")
    price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    is_available: bool = True
    low_stock_threshold: int = Field(default=5, ge=0)

class InventoryUpdate(BaseModel):
    bottle_size: str | None = None
    price: Decimal | None = Field(None, gt=0)
    stock_quantity: int | None = Field(None, ge=0)
    is_available: bool | None = None
    low_stock_threshold: int | None = Field(None, ge=0)
    expected_version: int | None = None

class StockAdjustmentRequest(BaseModel):
    new_quantity: int = Field(..., ge=0, description="New absolute quantity")
    reason: str = Field(..., min_length=2, max_length=100, description="Reason: Restock, Damaged, Count Audit, etc.")
    notes: str | None = Field(None, max_length=500)
    expected_version: int | None = None

class InventoryMovementOut(BaseModel):
    id: str
    inventory_id: str
    retailer_id: str
    previous_quantity: int
    new_quantity: int
    change_quantity: int
    reason: str
    notes: str | None = None
    actor_name: str | None = None
    actor_role: str | None = None
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
    items: list[InventoryOut]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary: InventorySummaryOut
    categories: list[CategoryOut] = []
    brands: list[str] = []

class ProductInventorySummary(BaseModel):
    id: str
    bottle_size: str
    price: Decimal
    stock_quantity: int
    is_available: bool

    model_config = ConfigDict(from_attributes=True)

class ProductOut(BaseModel):
    id: str
    name: str
    brand: str
    category_id: str
    category_name: str | None = None
    category_slug: str | None = None
    description: str | None = None
    alcohol_by_volume: str | None = None
    country_of_origin: str
    is_active: bool
    is_demo_data: bool
    primary_image_url: str | None = None
    starting_price: Decimal | None = None
    available_sizes: list[str] = []
    in_stock: bool = False
    default_inventory_id: str | None = None
    inventories: list[ProductInventorySummary] = []

    model_config = ConfigDict(from_attributes=True)

class ProductDetailOut(BaseModel):
    id: str
    name: str
    brand: str
    category_id: str
    category_name: str | None = None
    description: str | None = None
    alcohol_by_volume: str | None = None
    country_of_origin: str
    is_active: bool
    is_demo_data: bool
    images: list[ProductImageOut] = []
    inventories: list[InventoryOut] = []
    compliance_notice: str = (
        "Demonstration product listing. Regulated alcoholic beverage under Telangana Excise Laws. "
        "Online home delivery and commercial order fulfillment are disabled."
    )

    model_config = ConfigDict(from_attributes=True)

class ProductCreate(BaseModel):
    name: str
    brand: str
    category_id: str
    description: str | None = None
    alcohol_by_volume: str | None = None
    country_of_origin: str = "India"
    image_url: str | None = None
    bottle_size: str = "750ml"
    price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(default=10, ge=0)

# --- Bulk CSV/Excel Import/Export Schemas ---
class InventoryCsvRowPreview(BaseModel):
    row_number: int
    product_id: str | None = None
    product_name: str | None = None
    brand: str | None = None
    category: str | None = None
    bottle_size: str
    price: Decimal | None = None
    stock_quantity: int | None = None
    is_available: bool = True
    low_stock_threshold: int = 5
    action: str = "NEW"  # NEW, UPDATE, INVALID
    status: str = "VALID"  # VALID, ERROR
    is_valid: bool = True
    errors: list[str] = []
    error_message: str | None = None
    changes_summary: str | None = None

class InventoryImportPreviewRequest(BaseModel):
    raw_csv: str

class InventoryImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    error_rows: int
    rows: list[InventoryCsvRowPreview] = []
    items: list[InventoryCsvRowPreview] = []

class InventoryImportApplyItem(BaseModel):
    product_id: str | None = None
    product_name: str | None = None
    brand: str | None = None
    category: str | None = None
    bottle_size: str
    price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(..., ge=0)
    is_available: bool = True
    low_stock_threshold: int = Field(default=5, ge=0)

class InventoryImportApplyRequest(BaseModel):
    items: list[InventoryImportApplyItem]

class InventoryImportApplyResponse(BaseModel):
    imported_count: int
    created_count: int = 0
    updated_count: int
    total_processed: int
    message: str

