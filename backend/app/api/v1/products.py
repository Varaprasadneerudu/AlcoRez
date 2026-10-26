from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.catalog import ProductOut, ProductDetailOut, CategoryOut
from app.services.catalog_service import CatalogService
from app.models.product import Category

router = APIRouter(tags=["Catalog & Products"])

@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return CatalogService.get_categories(db, active_only=True)

@router.get("/categories/{slug}", response_model=CategoryOut)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == slug, Category.is_active == True).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return cat

@router.get("/products")
def list_products(
    search: Optional[str] = Query(None, description="Search by product name or brand"),
    category: Optional[str] = Query(None, description="Category slug"),
    retailer_id: Optional[str] = Query(None, description="Filter by licensed retailer ID"),
    bottle_size: Optional[str] = Query(None, description="e.g. 750ml, 375ml"),
    min_price: Optional[Decimal] = Query(None, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, description="Maximum price filter"),
    sort_by: str = Query("name_asc", description="name_asc, name_desc, price_asc, price_desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    items, total = CatalogService.get_products(
        db=db,
        search=search,
        category_slug=category,
        retailer_id=retailer_id,
        bottle_size=bottle_size,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1
    }

@router.get("/products/{product_id}", response_model=ProductDetailOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    detail = CatalogService.get_product_details(db, product_id)
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or inactive")
    return detail
