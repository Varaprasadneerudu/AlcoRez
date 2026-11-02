
from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardStats,
    AuditLogOut,
    ComplianceApprovalOut,
    UserUpdateAdmin,
)
from app.schemas.auth import UserOut
from app.schemas.order import OrderOut
from app.schemas.retailer import RetailerOut, RetailerReviewRequest
from app.services.admin_service import AdminService
from app.services.order_service import OrderService
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session, joinedload

router = APIRouter(prefix="/admin", tags=["Administrator Portal"])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminService.get_dashboard_stats(db)

@router.get("/users", response_model=list[UserOut])
def get_all_users(
    role: str | None = Query(None, description="customer, retailer, admin, or all"),
    search: str | None = Query(None, description="Search query by name, email, or phone"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return AdminService.get_users(db, role_filter=role, search=search)

@router.patch("/users/{user_id}", response_model=UserOut)
def update_user_details(
    user_id: str,
    user_in: UserUpdateAdmin,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    return AdminService.update_user(db, user_id, user_in, admin_user=admin, ip_address=ip)

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    return AdminService.delete_user(db, user_id, admin_user=admin, ip_address=ip)

@router.get("/retailers/pending", response_model=list[RetailerOut])
def get_pending_retailers(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminService.get_pending_retailers(db)

@router.get("/retailers", response_model=list[RetailerOut])
def get_all_retailers(
    status: str | None = Query(None, description="draft, pending_review, approved, rejected, suspended, expired"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return AdminService.get_all_retailers(db, status_filter=status)

@router.patch("/retailers/{retailer_id}/review", response_model=RetailerOut)
def review_retailer_application(
    retailer_id: str,
    review_in: RetailerReviewRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    return AdminService.review_retailer(db, retailer_id, review_in, admin_user=admin, ip_address=ip)

@router.get("/compliance", response_model=list[ComplianceApprovalOut])
def get_compliance_status(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminService.get_compliance_approvals(db)

@router.get("/audit-logs", response_model=list[AuditLogOut])
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    return AdminService.get_audit_logs(db, skip=skip, limit=limit)

@router.get("/orders", response_model=list[OrderOut])
def get_all_platform_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return OrderService.to_order_out_batch(db, orders)
