from app.core.database import get_db
from app.core.security import decode_token
from app.models.retailer import Retailer, RetailerMembership
from app.models.user import CustomerProfile, User, UserRole
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
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

def get_current_user_optional(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User | None:
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
    cust_role = getattr(current_user.role, "value", str(current_user.role)).lower()
    if cust_role not in ("customer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Customer privileges required"
        )
    return current_user

def get_current_verified_customer(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    cust_role = getattr(current_user.role, "value", str(current_user.role)).lower()
    if cust_role not in ("customer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Customer privileges required"
        )
    if cust_role == "admin":
        return current_user

    profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    is_age_verified = bool(current_user.is_verified and profile and profile.age_verified)
    if not is_age_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Under the Telangana Excise Act, 1968, verified 21+ legal age status is strictly required to execute simulated liquor checkout reservations. Please complete age verification in your profile."
        )
    return current_user

def get_current_retailer_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> tuple[User, Retailer]:
    role_str = getattr(current_user.role, "value", str(current_user.role)).lower()
    if role_str not in ("retailer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Retailer privileges required"
        )

    # Check if user has an authorized retailer record or approved membership
    retailer = db.query(Retailer).filter(Retailer.user_id == current_user.id).first()
    if not retailer:
        membership = db.query(RetailerMembership).filter(RetailerMembership.user_id == current_user.id).first()
        if membership:
            retailer = db.query(Retailer).filter(Retailer.id == membership.retailer_id).first()

    # If Super Admin, allow access to primary licensed retailer if none explicitly linked
    if not retailer and role_str == "admin":
        retailer = db.query(Retailer).first()

    if not retailer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No licensed retailer profile linked to this user account"
        )

    return current_user, retailer

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    admin_role = getattr(current_user.role, "value", str(current_user.role)).lower()
    if admin_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required"
        )
    return current_user

def get_current_delivery_partner(current_user: User = Depends(get_current_user)) -> User:
    dp_role = getattr(current_user.role, "value", str(current_user.role)).lower()
    if dp_role not in ("delivery_partner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Verified Delivery Partner privileges required"
        )
    return current_user
