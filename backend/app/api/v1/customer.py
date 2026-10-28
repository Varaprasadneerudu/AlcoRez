from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_customer
from app.models.user import User, Address, CustomerProfile
from app.schemas.customer import AddressCreate, AddressOut, CustomerProfileOut, CustomerProfileUpdate
from app.core.compliance import ComplianceEngine

router = APIRouter(prefix="/customer", tags=["Customer"])

@router.get("/addresses", response_model=List[AddressOut])
def get_addresses(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    addresses = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()
    return addresses

@router.post("/addresses", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(addr_in: AddressCreate, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    if addr_in.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    new_addr = Address(
        user_id=current_user.id,
        label=addr_in.label,
        address_line1=addr_in.address_line1,
        address_line2=addr_in.address_line2,
        landmark=addr_in.landmark,
        city=addr_in.city,
        state=addr_in.state,
        postal_code=addr_in.postal_code,
        is_default=addr_in.is_default
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr

@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: str, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    db.delete(addr)
    db.commit()
    return None

@router.get("/profile", response_model=CustomerProfileOut)
def get_customer_profile(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if not profile:
        profile = CustomerProfile(user_id=current_user.id, age_verified=False)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

# --- Customer Favorites Endpoints ---
from sqlalchemy.orm import joinedload
from app.models.favorite import FavoriteProduct, FavoriteRetailer
from app.models.product import Product
from app.models.retailer import Retailer, RetailerStatus
from app.schemas.customer import CustomerFavoritesOut, FavoriteIdsOut, FavoriteProductOut, FavoriteRetailerOut
from app.services.catalog_service import CatalogService
from app.services.retailer_service import RetailerService

@router.get("/favorites", response_model=CustomerFavoritesOut)
def get_customer_favorites(
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    fav_products = (
        db.query(FavoriteProduct)
        .filter(FavoriteProduct.user_id == current_user.id)
        .order_by(FavoriteProduct.created_at.desc())
        .all()
    )
    fav_retailers = (
        db.query(FavoriteRetailer)
        .filter(FavoriteRetailer.user_id == current_user.id)
        .order_by(FavoriteRetailer.created_at.desc())
        .all()
    )

    product_ids = [fp.product_id for fp in fav_products]
    products_map = {}
    if product_ids:
        items, _ = CatalogService.get_products(db, product_ids=product_ids, limit=len(product_ids))
        products_map = {item.id: item for item in items}

    retailer_ids = [fr.retailer_id for fr in fav_retailers]
    retailers_map = {}
    if retailer_ids:
        rets = (
            db.query(Retailer)
            .options(joinedload(Retailer.licenses))
            .filter(Retailer.id.in_(retailer_ids))
            .all()
        )
        retailers_map = {r.id: RetailerService.to_retailer_out(db, r) for r in rets}

    out_products = []
    for fp in fav_products:
        p_out = products_map.get(fp.product_id)
        if p_out:
            out_products.append(FavoriteProductOut(
                id=fp.id,
                product_id=fp.product_id,
                created_at=fp.created_at,
                product=p_out
            ))

    out_retailers = []
    for fr in fav_retailers:
        r_out = retailers_map.get(fr.retailer_id)
        if r_out:
            out_retailers.append(FavoriteRetailerOut(
                id=fr.id,
                retailer_id=fr.retailer_id,
                created_at=fr.created_at,
                retailer=r_out
            ))

    return CustomerFavoritesOut(products=out_products, retailers=out_retailers)

@router.get("/favorites/ids", response_model=FavoriteIdsOut)
def get_customer_favorite_ids(
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    p_ids = [r[0] for r in db.query(FavoriteProduct.product_id).filter(FavoriteProduct.user_id == current_user.id).all()]
    r_ids = [r[0] for r in db.query(FavoriteRetailer.retailer_id).filter(FavoriteRetailer.user_id == current_user.id).all()]
    return FavoriteIdsOut(product_ids=p_ids, retailer_ids=r_ids)

@router.post("/favorites/products/{product_id}", status_code=status.HTTP_201_CREATED)
def add_favorite_product(
    product_id: str,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or inactive")

    existing = db.query(FavoriteProduct).filter(
        FavoriteProduct.user_id == current_user.id,
        FavoriteProduct.product_id == product_id
    ).first()
    if not existing:
        fav = FavoriteProduct(user_id=current_user.id, product_id=product_id)
        db.add(fav)
        db.commit()
        db.refresh(fav)
        return {"message": "Product added to favorites", "favorite_id": fav.id}
    return {"message": "Product already in favorites", "favorite_id": existing.id}

@router.delete("/favorites/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite_product(
    product_id: str,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    fav = db.query(FavoriteProduct).filter(
        FavoriteProduct.user_id == current_user.id,
        FavoriteProduct.product_id == product_id
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
    return None

@router.post("/favorites/retailers/{retailer_id}", status_code=status.HTTP_201_CREATED)
def add_favorite_retailer(
    retailer_id: str,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    ret = db.query(Retailer).filter(Retailer.id == retailer_id, Retailer.status == RetailerStatus.APPROVED).first()
    if not ret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Licensed retailer not found or not approved")

    existing = db.query(FavoriteRetailer).filter(
        FavoriteRetailer.user_id == current_user.id,
        FavoriteRetailer.retailer_id == retailer_id
    ).first()
    if not existing:
        fav = FavoriteRetailer(user_id=current_user.id, retailer_id=retailer_id)
        db.add(fav)
        db.commit()
        db.refresh(fav)
        return {"message": "Retailer added to favorites", "favorite_id": fav.id}
    return {"message": "Retailer already in favorites", "favorite_id": existing.id}

@router.delete("/favorites/retailers/{retailer_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite_retailer(
    retailer_id: str,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    fav = db.query(FavoriteRetailer).filter(
        FavoriteRetailer.user_id == current_user.id,
        FavoriteRetailer.retailer_id == retailer_id
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
    return None
