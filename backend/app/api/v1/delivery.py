from app.api.deps import get_current_delivery_partner
from app.core.database import get_db
from app.models.user import User
from app.schemas.delivery import (
    AvailableDeliveryOrderOut,
    DeliveryCompleteRequest,
    DeliveryEarningsSummaryOut,
    DeliveryPartnerProfileOut,
    DeliveryStatusUpdate,
    DeliveryTripHistoryOut,
)
from app.services.delivery_service import DeliveryService
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

router = APIRouter(prefix="/delivery", tags=["Delivery Partner Operations"])


@router.get("/profile", response_model=DeliveryPartnerProfileOut)
def get_delivery_profile(
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Get the current delivery partner's profile and real-time status."""
    return DeliveryService.get_or_create_profile(db, current_partner)


@router.patch("/status", response_model=DeliveryPartnerProfileOut)
def update_delivery_status(
    status_update: DeliveryStatusUpdate,
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Toggle online/offline duty status and update active service zone."""
    return DeliveryService.update_status(db, current_partner, status_update)


@router.get("/available-orders", response_model=list[AvailableDeliveryOrderOut])
def get_available_pickup_orders(
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Fetch live pool of orders waiting at licensed Telangana wine shops for delivery pickup."""
    return DeliveryService.get_available_orders(db, current_partner)


@router.get("/active-order", response_model=AvailableDeliveryOrderOut | None)
def get_current_active_delivery(
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Fetch the active delivery trip assigned to this delivery partner."""
    return DeliveryService.get_active_order(db, current_partner)


@router.post("/orders/{order_id}/accept", response_model=AvailableDeliveryOrderOut)
def accept_order_pickup(
    order_id: str,
    request: Request,
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Accept an available order pickup request."""
    ip = request.client.host if request.client else None
    return DeliveryService.accept_order(db, current_partner, order_id, ip_address=ip)


@router.post("/orders/{order_id}/pickup", response_model=AvailableDeliveryOrderOut)
def confirm_order_pickup_at_store(
    order_id: str,
    request: Request,
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Confirm receipt of package at the licensed retailer counter and transition order to out_for_delivery."""
    ip = request.client.host if request.client else None
    return DeliveryService.pickup_order(db, current_partner, order_id, ip_address=ip)


@router.post("/orders/{order_id}/complete", response_model=AvailableDeliveryOrderOut)
def complete_doorstep_delivery(
    order_id: str,
    payload: DeliveryCompleteRequest,
    request: Request,
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Complete delivery with mandatory physical 21+ verification and customer OTP confirmation."""
    ip = request.client.host if request.client else None
    return DeliveryService.complete_delivery(db, current_partner, order_id, payload, ip_address=ip)


@router.get("/history", response_model=list[DeliveryTripHistoryOut])
def get_completed_trip_history(
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Retrieve history of completed trips and payouts for this partner."""
    return DeliveryService.get_trip_history(db, current_partner)


@router.get("/earnings", response_model=DeliveryEarningsSummaryOut)
def get_earnings_breakdown(
    current_partner: User = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    """Retrieve daily, weekly, and total earnings with active incentive progress."""
    return DeliveryService.get_earnings_summary(db, current_partner)

