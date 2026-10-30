from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CartItemAdd(BaseModel):
    inventory_id: str
    quantity: int = Field(default=1, ge=1, le=10)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=10)

class CartItemOut(BaseModel):
    id: str
    inventory_id: str
    product_id: str
    product_name: str
    brand: str
    bottle_size: str
    unit_price: Decimal
    quantity: int
    total_price: Decimal
    image_url: str | None = None
    retailer_id: str
    retailer_name: str
    is_available: bool

    model_config = ConfigDict(from_attributes=True)

class CartOut(BaseModel):
    id: str
    user_id: str
    items: list[CartItemOut] = []
    subtotal: Decimal
    delivery_fee: Decimal
    taxes: Decimal
    total_amount: Decimal
    item_count: int
    is_demo_cart: bool = True
    compliance_disclaimer: str = (
        "Demonstration Cart. In accordance with the Telangana Excise Act, actual alcohol orders and home delivery "
        "cannot be fulfilled. Any checkout created will be a non-binding test order."
    )
