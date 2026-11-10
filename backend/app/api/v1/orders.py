
from app.api.deps import get_current_customer, get_current_user, get_current_verified_customer
from app.core.compliance import ComplianceEngine
from app.core.database import get_db
from app.models.user import User
from app.schemas.order import (
    LivePaymentAttemptRequest,
    OrderOut,
    SimulatedCheckoutRequest,
)
from app.services.order_service import OrderService
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["Orders & Checkout Simulation"])

@router.post("/test-orders", response_model=list[OrderOut], status_code=status.HTTP_201_CREATED)
def create_simulated_order(
    checkout_in: SimulatedCheckoutRequest,
    request: Request,
    current_user: User = Depends(get_current_verified_customer),
    db: Session = Depends(get_db)
):
    """
    Creates simulated demonstration orders.
    Enforces compliance: No live payments, no real alcohol delivery.
    """
    ip = request.client.host if request.client else None
    return OrderService.create_simulated_order(db, current_user, checkout_in, ip_address=ip)

@router.get("/orders", response_model=list[OrderOut])
def get_user_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return OrderService.get_customer_orders(db, current_user)

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order_details(order_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return OrderService.get_order_by_id(db, order_id, current_user)

@router.post("/orders/live-payment-attempt")
def attempt_live_payment(payment_in: LivePaymentAttemptRequest):
    """
    Explicit endpoint testing compliance gate:
    Direct attempt to trigger a live alcohol payment gateway.
    Will be strictly blocked by the fail-closed ComplianceEngine.
    """
    ComplianceEngine.assert_real_payment_allowed()
    return {"status": "UNREACHABLE"}

@router.post("/orders/live-dispatch-attempt")
def attempt_live_dispatch():
    """
    Explicit endpoint testing compliance gate:
    Direct attempt to assign alcohol delivery logistics.
    Will be strictly blocked by the fail-closed ComplianceEngine.
    """
    ComplianceEngine.assert_alcohol_dispatch_allowed()
    return {"status": "UNREACHABLE"}
