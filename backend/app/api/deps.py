from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.retailer import Retailer, RetailerMembership

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account is deactivated")
    return user

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()

def get_current_customer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.CUSTOMER and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Customer privileges required"
        )
    return current_user

def get_current_retailer_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> tuple[User, Retailer]:
    if current_user.role != UserRole.RETAILER and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Retailer privileges required"
        )
    retailer = db.query(Retailer).filter(Retailer.user_id == current_user.id).first()
    if not retailer:
        membership = db.query(RetailerMembership).filter(RetailerMembership.user_id == current_user.id).first()
        if membership:
            retailer = db.query(Retailer).filter(Retailer.id == membership.retailer_id).first()
    if not retailer:
        if current_user.role == UserRole.ADMIN:
            retailer = db.query(Retailer).first()
        if not retailer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No licensed retailer profile linked to this user account"
            )
    return current_user, retailer

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required"
        )
    return current_user
