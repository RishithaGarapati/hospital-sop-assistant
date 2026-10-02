from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.database import get_db
from app.services.user_service import UserService
from app.core.security import create_access_token, get_current_user
from app.schemas.auth import TokenResponse, UserCreate, UserResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await UserService.authenticate(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    user.last_login = datetime.utcnow()
    await db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user_id=user.id, name=user.name, role=user.role)


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await UserService.get_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await UserService.create(db, data.name, data.email, data.password, data.role, data.department)
    await db.commit()
    return user


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return current_user
