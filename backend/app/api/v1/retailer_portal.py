
from app.api.deps import get_current_retailer_user, get_current_user
from app.core.database import get_db
from app.models.retailer import Retailer, RetailerStatus
from app.models.user import User
from app.schemas.catalog import (
    InventoryCreate,
    InventoryImportApplyRequest,
    InventoryImportApplyResponse,
    InventoryImportPreviewRequest,
    InventoryImportPreviewResponse,
    InventoryMovementOut,
    InventoryOut,
    InventoryUpdate,
    PaginatedInventoryResponse,
    StockAdjustmentRequest,
)
from app.schemas.order import OrderOut, OrderStatusUpdate
from app.schemas.retailer import (
    RetailerApplicationCreate,
    RetailerDashboardOut,
    RetailerOut,
)
from app.services.order_service import OrderService
from app.services.retailer_service import RetailerService
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

router = APIRouter(tags=["Retailer Portal & Operations"])

# Public endpoints
@router.get("/retailers", response_model=list[RetailerOut])
def list_approved_retailers(
    postal_code: str | None = Query(None, description="Filter retailers by locality PIN code (e.g. 500081)"),
    search: str | None = Query(None, description="Search retailers by shop name or trade name"),
    db: Session = Depends(get_db)
):
    query = (
        db.query(Retailer)
        .options(joinedload(Retailer.licenses))
        .filter(Retailer.status == RetailerStatus.APPROVED)
    )
    if postal_code:
        query = query.filter(Retailer.postal_code == postal_code)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (Retailer.shop_name.ilike(term)) | (Retailer.trade_name.ilike(term))
        )
    retailers = query.order_by(Retailer.shop_name.asc()).all()
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

@router.get("/retailers/{retailer_id}/catalogue")
def get_retailer_catalogue_public(
    retailer_id: str,
    search: str | None = Query(None),
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    r = db.query(Retailer).filter(Retailer.id == retailer_id, Retailer.status == RetailerStatus.APPROVED).first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found or inactive")
    from app.services.catalog_service import CatalogService
    skip = (page - 1) * limit
    items, total = CatalogService.get_products(
        db=db,
        retailer_id=retailer_id,
        search=search,
        category_slug=category,
        skip=skip,
        limit=limit
    )
    return {
        "retailer": RetailerService.to_retailer_out(db, r),
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

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
    search: str | None = None,
    category_id: str | None = None,
    brand: str | None = None,
    stock_status: str | None = None,
    listing_status: str | None = None,
    sort_by: str | None = "updated_at",
    sort_order: str | None = "desc",
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

@router.get("/retailer/inventory/{inventory_id}/movements", response_model=list[InventoryMovementOut])
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

# --- Bulk Inventory Import / Export Endpoints (Feature D) ---

@router.get("/retailer/inventory/export")
def export_retailer_inventory(
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    _, retailer = auth_context
    csv_data = RetailerService.export_inventory_csv(db, retailer)
    filename = f"inventory_{retailer.postal_code}_{retailer.shop_name[:12].replace(' ', '_')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/retailer/inventory/import/preview", response_model=InventoryImportPreviewResponse)
def preview_inventory_import(
    payload: InventoryImportPreviewRequest,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    _, retailer = auth_context
    if not payload.raw_csv or not payload.raw_csv.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No CSV content provided")
    return RetailerService.preview_inventory_csv(db, retailer, payload.raw_csv)

@router.post("/retailer/inventory/import/apply", response_model=InventoryImportApplyResponse)
def apply_inventory_import(
    payload: InventoryImportApplyRequest,
    request: Request,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, retailer = auth_context
    ip = request.client.host if request.client else None
    return RetailerService.apply_inventory_csv(
        db=db,
        retailer=retailer,
        actor_user=user,
        items=payload.items,
        ip_address=ip
    )

@router.get("/retailer/orders", response_model=list[OrderOut])
def get_retailer_orders(auth_context=Depends(get_current_retailer_user), db: Session = Depends(get_db)):
    _, retailer = auth_context
    return OrderService.get_retailer_orders(db, retailer.id)

@router.patch("/retailer/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    status_in: OrderStatusUpdate,
    request: Request,
    auth_context=Depends(get_current_retailer_user),
    db: Session = Depends(get_db)
):
    user, _ = auth_context
    ip = request.client.host if request.client else None
    return OrderService.update_order_status(db, order_id, status_in, actor_user=user, ip_address=ip)
