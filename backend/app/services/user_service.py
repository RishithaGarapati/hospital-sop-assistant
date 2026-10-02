from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.models.user import User
from app.core.security import hash_password, verify_password


class UserService:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, name: str, email: str, password: str, role: str = "staff", department: str = None) -> User:
        user = User(
            name=name, email=email,
            hashed_password=hash_password(password),
            role=role, department=department,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> Optional[User]:
        user = await UserService.get_by_email(db, email)
        if user and verify_password(password, user.hashed_password):
            return user
        return None

    @staticmethod
    async def list_all(db: AsyncSession) -> list:
        result = await db.execute(select(User).order_by(User.created_at.desc()))
        return result.scalars().all()
