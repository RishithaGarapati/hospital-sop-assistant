from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    role: UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.staff
    department: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    department: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True
