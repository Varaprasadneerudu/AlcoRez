from datetime import datetime

from app.core.compliance import ComplianceEngine
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.retailer import Retailer, RetailerMembership
from app.models.user import CustomerProfile, User, UserRole
from app.schemas.auth import Token, UserLogin, UserRegister
from app.services.audit_service import AuditService
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class AuthService:
    @staticmethod
    def register_user(db: Session, reg_in: UserRegister, ip_address: str | None = None) -> User:
        existing = db.query(User).filter(User.email == reg_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists"
            )

        # Enforce statutory 21+ age check if DOB provided for customer
        age_verified = False
        dob_date = None
        if reg_in.date_of_birth:
            if not ComplianceEngine.validate_customer_age(reg_in.date_of_birth):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Under the Telangana Excise Act, users must be at least 21 years of age to access alcoholic beverage services."
                )
            dob_date = datetime.strptime(reg_in.date_of_birth, "%Y-%m-%d").date()
            age_verified = True

        # Public self-registration is strictly restricted to Customer accounts.
        # Retailer and Administrator accounts can ONLY be provisioned by a Super Admin.
        if reg_in.role and reg_in.role != UserRole.CUSTOMER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Public registration of Administrator or Retailer accounts is prohibited. These roles must be provisioned by a Super Admin."
            )

        hashed_pw = hash_password(reg_in.password)
        new_user = User(
            email=reg_in.email,
            hashed_password=hashed_pw,
            full_name=reg_in.full_name,
            phone=reg_in.phone,
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=age_verified
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create linked profile for customer
        profile = CustomerProfile(
            user_id=new_user.id,
            date_of_birth=dob_date,
            age_verified=age_verified
        )
        db.add(profile)
        db.commit()

        AuditService.log_event(
            db=db,
            action="USER_REGISTERED",
            entity_type="user",
            actor_user_id=new_user.id,
            actor_role=new_user.role.value,
            entity_id=new_user.id,
            ip_address=ip_address,
            details={"email": new_user.email, "role": new_user.role.value, "age_verified": age_verified}
        )
        return new_user

    @staticmethod
    def authenticate_user(db: Session, login_in: UserLogin, ip_address: str | None = None) -> Token:
        user = db.query(User).filter(User.email == login_in.email).first()
        if not user or not verify_password(login_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is suspended or deactivated"
            )

        access_token = create_access_token(subject=user.id, role=user.role.value)
        refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

        # Transparently upgrade legacy high-cost hashes to rounds=10 for faster mobile logins
        if user.hashed_password.startswith(("$2b$12$", "$2a$12$")):
            try:
                user.hashed_password = hash_password(login_in.password)
                db.add(user)
                db.commit()
            except Exception:
                pass

        AuditService.log_event(
            db=db,
            action="USER_LOGIN_SUCCESS",
            entity_type="user",
            actor_user_id=user.id,
            actor_role=user.role.value,
            entity_id=user.id,
            ip_address=ip_address
        )

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            role=user.role.value,
            user_id=user.id,
            full_name=user.full_name,
            email=user.email
        )

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Token:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found or inactive")

        # Rotate tokens
        new_access_token = create_access_token(subject=user.id, role=user.role.value)
        new_refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            role=user.role.value,
            user_id=user.id,
            full_name=user.full_name,
            email=user.email
        )
