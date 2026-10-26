from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_retailer_user
from app.models.user import User
from app.models.retailer import Retailer, RetailerStatus
from app.schemas.retailer import RetailerApplicationCreate, RetailerOut, RetailerDashboardOut
from app.schemas.catalog import (
    InventoryCreate,
    InventoryUpdate,
    InventoryOut,
    StockAdjustmentRequest,
    InventoryMovementOut,
    PaginatedInventoryResponse,
)
from app.schemas.order import OrderOut, OrderStatusUpdate
from app.services.retailer_service import RetailerService
from app.services.order_service import OrderService

router = APIRouter(tags=["Retailer Portal & Operations"])

# Public endpoints
@router.get("/retailers", response_model=List[RetailerOut])
def list_approved_retailers(db: Session = Depends(get_db)):
    retailers = (
        db.query(Retailer)
        .options(joinedload(Retailer.licenses))
        .filter(Retailer.status == RetailerStatus.APPROVED)
        .all()
    )
    return [RetailerService.to_retailer_out(db, r) for r in retailers]

@router.get("/retailers/{retailer_id}", response_model=RetailerOut)
def get_retailer_public(retailer_id: str, db: Session = Depends(get_db)):
    r = (
        db.query(Retailer)
        .options(joinedload(Retailer.licenses))
        .filter(
            Retailer.id == retailer_id,
            Retailer.status == RetailerStatus.APPROVED
        )
        .first()
    )
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Retailer store not found or currently suspended under excise regulation"
        )
    return RetailerService.to_retailer_out(db, r)

# Authenticated Retailer Portal endpoints
@router.post("/retailer/applications", response_model=RetailerOut, status_code=status.HTTP_201_CREATED)
def submit_retailer_application(
    app_in: RetailerApplicationCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    return RetailerService.apply_for_onboarding(db, current_user, app_in, ip_address=ip)

@router.get("/retailer/dashboard", response_model=RetailerDashboardOut)
def get_retailer_dashboard(auth_context=Depends(get_current_retailer_user), db: Session = Depends(get_db)):
    user, retailer = auth_context
    return RetailerService.get_dashboard_metrics(db, retailer)

@router.get("/retailer/inventory", response_model=PaginatedInventoryResponse)
def get_my_inventory(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    brand: Optional[str] = None,
    stock_status: Optional[str] = None,
    listing_status: Optional[str] = None,
    sort_by: Optional[str] = "updated_at",
    sort_order: Optional[str] = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, retailer = auth_context
    return RetailerService.get_retailer_inventory_paginated(
        db=db,
        retailer_id=retailer.id,
        search=search,
        category_id=category_id,
        brand=brand,
        stock_status=stock_status,
        listing_status=listing_status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )

@router.post("/retailer/inventory", response_model=InventoryOut, status_code=status.HTTP_201_CREATED)
def create_inventory_listing(
    inv_in: InventoryCreate,
    request: Request,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, retailer = auth_context
    ip = request.client.host if request.client else None
    return RetailerService.add_inventory_item(db, retailer, inv_in, actor_user=user, ip_address=ip)

@router.patch("/retailer/inventory/{inventory_id}", response_model=InventoryOut)
def update_inventory_listing(
    inventory_id: str,
    inv_update: InventoryUpdate,
    request: Request,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, retailer = auth_context
    ip = request.client.host if request.client else None
    return RetailerService.update_inventory_item(db, inventory_id, retailer, inv_update, actor_user=user, ip_address=ip)

@router.post("/retailer/inventory/{inventory_id}/adjust-stock", response_model=InventoryOut)
def adjust_inventory_stock(
    inventory_id: str,
    adj_in: StockAdjustmentRequest,
    request: Request,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, retailer = auth_context
    ip = request.client.host if request.client else None
    return RetailerService.adjust_inventory_stock(db, inventory_id, retailer, adj_in, actor_user=user, ip_address=ip)

@router.get("/retailer/inventory/{inventory_id}/movements", response_model=List[InventoryMovementOut])
def get_inventory_movements(
    inventory_id: str,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, retailer = auth_context
    return RetailerService.get_inventory_movements(db, inventory_id, retailer, actor_user=user)

@router.delete("/retailer/inventory/{inventory_id}")
def delete_or_deactivate_inventory_listing(
    inventory_id: str,
    request: Request,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, retailer = auth_context
    ip = request.client.host if request.client else None
    return RetailerService.delete_or_deactivate_inventory_item(db, inventory_id, retailer, actor_user=user, ip_address=ip)

@router.get("/retailer/orders", response_model=List[OrderOut])
def get_retailer_orders(auth_context=Depends(get_current_retailer_user), db: Session = Depends(get_db)):
    user, retailer = auth_context
    return OrderService.get_retailer_orders(db, retailer.id)

@router.patch("/retailer/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    status_in: OrderStatusUpdate,
    request: Request,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, retailer = auth_context
    ip = request.client.host if request.client else None
    return OrderService.update_order_status(db, order_id, status_in, actor_user=user, ip_address=ip)
