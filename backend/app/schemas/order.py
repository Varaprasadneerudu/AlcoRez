from datetime import datetime
from decimal import Decimal

from app.models.order import OrderStatus
from pydantic import BaseModel, ConfigDict


class SimulatedCheckoutRequest(BaseModel):
    address_id: str | None = None
    customer_notes: str | None = None
    simulate_payment_success: bool = True

class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_name: str
    brand: str
    bottle_size: str
    unit_price: Decimal
    quantity: int
    total_price: Decimal

class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    user_id: str
    retailer_id: str
    retailer_name: str | None = None
    status: OrderStatus
    subtotal: Decimal
    delivery_fee: Decimal
    taxes: Decimal
    total_amount: Decimal
    address_snapshot: str
    is_simulated: bool
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut] = []
    payment_status: str | None = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: str | None = None

class LivePaymentAttemptRequest(BaseModel):
    order_id: str
    payment_method: str = "CARD"
    amount: Decimal
