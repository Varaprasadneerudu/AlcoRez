from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.order import OrderStatus

class SimulatedCheckoutRequest(BaseModel):
    address_id: Optional[str] = None
    customer_notes: Optional[str] = None
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
    retailer_name: Optional[str] = None
    status: OrderStatus
    subtotal: Decimal
    delivery_fee: Decimal
    taxes: Decimal
    total_amount: Decimal
    address_snapshot: str
    is_simulated: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []
    payment_status: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None

class LivePaymentAttemptRequest(BaseModel):
    order_id: str
    payment_method: str = "CARD"
    amount: Decimal
