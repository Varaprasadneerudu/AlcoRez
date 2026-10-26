from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_customer
from app.models.user import User
from app.schemas.cart import CartOut, CartItemAdd, CartItemUpdate
from app.services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])

@router.get("", response_model=CartOut)
def get_cart(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    return CartService.get_cart_view(db, current_user)

@router.post("/items", response_model=CartOut, status_code=status.HTTP_201_CREATED)
def add_item(item_in: CartItemAdd, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    return CartService.add_item_to_cart(db, current_user, item_in)

@router.patch("/items/{item_id}", response_model=CartOut)
def update_item_quantity(item_id: str, item_in: CartItemUpdate, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    return CartService.update_item_quantity(db, current_user, item_id, item_in.quantity)

@router.delete("/items/{item_id}", response_model=CartOut)
def remove_item(item_id: str, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    return CartService.remove_item(db, current_user, item_id)

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    CartService.clear_cart(db, current_user)
    return None
