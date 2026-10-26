from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.user import UserRole

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    date_of_birth: Optional[str] = None # YYYY-MM-DD for statutory 21+ verification
    retailer_id: Optional[str] = None # Optional existing store to link new retailer to

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PasswordResetRequest(BaseModel):
    email: EmailStr
