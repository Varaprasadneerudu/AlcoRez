from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, RefreshTokenRequest, UserOut
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User

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
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out. Client should discard token."}
