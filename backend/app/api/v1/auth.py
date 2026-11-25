from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_user_optional
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.schemas.auth import (
    LogoutRequest,
    RefreshTokenRequest,
    Token,
    UserLogin,
    UserOut,
    UserRegister,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(reg_in: UserRegister, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    user = AuthService.register_user(db, reg_in, ip_address=ip)
    return user

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    token_obj = AuthService.authenticate_user(db, login_in, ip_address=ip)
    return token_obj

@router.post("/refresh", response_model=Token)
def refresh(refresh_in: RefreshTokenRequest, db: Session = Depends(get_db)):
    token_obj = AuthService.refresh_access_token(db, refresh_in.refresh_token)
    return token_obj

@router.get("/me", response_model=UserOut)
def get_current_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(
    logout_in: LogoutRequest | None = None,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    refresh_tok = logout_in.refresh_token if logout_in else None
    if not user_id and refresh_tok:
        payload = decode_token(refresh_tok)
        if payload and payload.get("type") == "refresh":
            user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials or valid refresh token required to log out"
        )
    AuthService.revoke_tokens(db, user_id=user_id, refresh_token=refresh_tok)
    return {"message": "Successfully logged out. Client should discard token."}
