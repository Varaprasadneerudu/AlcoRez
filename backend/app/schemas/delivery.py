from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DeliveryPartnerProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    full_name: str
    email: str
    phone: str | None = None
    vehicle_type: str
    vehicle_number: str
    driving_license_number: str
    is_online: bool
    current_zone: str
    rating: Decimal
    total_trips: int
    today_trips: int
    today_earnings: Decimal
    total_earnings: Decimal
    is_verified: bool
    compliance_permit_no: str


class DeliveryStatusUpdate(BaseModel):
    is_online: bool
    current_zone: str | None = None


class AvailableDeliveryOrderOut(BaseModel):
    order_id: str
    order_number: str
    retailer_name: str
    retailer_address: str
    retailer_phone: str | None = None
    customer_name: str
    customer_locality: str
    customer_address: str
    customer_phone: str | None = None
    items_count: int
    items_summary: str
    estimated_distance_km: float
    payout_amount: Decimal
    status: str
    created_at: datetime
    delivery_otp: str | None = None


class DeliveryCompleteRequest(BaseModel):
    otp: str
    customer_age_verified: bool = True
    id_proof_checked: bool = True
    notes: str | None = None


class DeliveryTripHistoryOut(BaseModel):
    order_id: str
    order_number: str
    retailer_name: str
    customer_locality: str
    completed_at: datetime
    items_count: int
    earnings: Decimal


class DeliveryEarningsSummaryOut(BaseModel):
    today_earnings: Decimal
    today_trips: int
    week_earnings: Decimal
    total_earnings: Decimal
    total_trips: int
    rating: Decimal
    incentive_target: int = 10
    incentive_completed: int = 6
    incentive_reward: Decimal = Decimal("200.00")

