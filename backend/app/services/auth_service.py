from datetime import datetime, timezone

from app.core.compliance import ComplianceEngine
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import CustomerProfile, RefreshToken, User, UserRole
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
        refresh_token, jti, expire = create_refresh_token(subject=user.id, role=user.role.value)

        # Persist refresh token in database for rotation/revocation tracking
        stored_token = RefreshToken(
            token_id=jti,
            user_id=user.id,
            expires_at=expire,
            is_revoked=False
        )
        db.add(stored_token)
        db.commit()

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

        token_id = payload.get("jti")
        user_id = payload.get("sub")
        if not token_id or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed refresh token claims"
            )

        # Check server-side token status
        stored_token = db.query(RefreshToken).filter(RefreshToken.token_id == token_id).first()
        if not stored_token or stored_token.is_revoked:
            # Token reuse/replay detected! Revoke all tokens for this user for security
            db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({
                "is_revoked": True,
                "revoked_at": datetime.now(timezone.utc)
            })
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked or already used"
            )

        # Check token expiration
        now = datetime.now(timezone.utc)
        token_expires = stored_token.expires_at
        if token_expires.tzinfo is None:
            token_expires = token_expires.replace(tzinfo=timezone.utc)
        if token_expires < now:
            stored_token.is_revoked = True
            stored_token.revoked_at = now
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired"
            )

        # Check user active status
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            stored_token.is_revoked = True
            stored_token.revoked_at = now
            db.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found or inactive")

        # Invalidate the submitted refresh token (rotation)
        stored_token.is_revoked = True
        stored_token.revoked_at = now

        # Issue new pair
        new_access_token = create_access_token(subject=user.id, role=user.role.value)
        new_refresh_token, new_jti, new_expire = create_refresh_token(subject=user.id, role=user.role.value)

        stored_token.replaced_by = new_jti

        new_stored_token = RefreshToken(
            token_id=new_jti,
            user_id=user.id,
            expires_at=new_expire,
            is_revoked=False
        )
        db.add(new_stored_token)
        db.commit()

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            role=user.role.value,
            user_id=user.id,
            full_name=user.full_name,
            email=user.email
        )

    @staticmethod
    def revoke_tokens(db: Session, user_id: str, refresh_token: str | None = None) -> None:
        now = datetime.now(timezone.utc)
        if refresh_token:
            payload = decode_token(refresh_token)
            if payload and payload.get("jti"):
                token_rec = db.query(RefreshToken).filter(RefreshToken.token_id == payload.get("jti")).first()
                if token_rec:
                    token_rec.is_revoked = True
                    token_rec.revoked_at = now

        # Revoke all active refresh tokens for the user upon logout
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).update({
            "is_revoked": True,
            "revoked_at": now
        })
        db.commit()
