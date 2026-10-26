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
