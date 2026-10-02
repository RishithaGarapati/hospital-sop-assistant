"""
Run this ONCE after starting the backend to create the default admin user.
Usage: cd backend && python ../scripts/create_admin.py
"""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")

async def main():
    from app.db.database import create_tables, AsyncSessionLocal
    from app.services.user_service import UserService

    await create_tables()
    async with AsyncSessionLocal() as db:
        existing = await UserService.get_by_email(db, "admin@hospital.in")
        if existing:
            print("Admin user already exists.")
            return
        user = await UserService.create(
            db,
            name="Dr. Admin",
            email="admin@hospital.in",
            password="Admin@1234",
            role="admin",
            department="Administration",
        )
        await db.commit()
        print(f"Admin created: {user.email} / Admin@1234")

asyncio.run(main())
