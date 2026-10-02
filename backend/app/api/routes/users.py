from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.security import require_admin
from app.services.user_service import UserService
from app.schemas.auth import UserResponse, UserCreate

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    return await UserService.list_all(db)


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    existing = await UserService.get_by_email(db, data.email)
    if existing:
        raise HTTPException(400, "Email already registered")
    user = await UserService.create(db, data.name, data.email, data.password, data.role, data.department)
    await db.commit()
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    user = await UserService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    await db.delete(user)
    await db.commit()
