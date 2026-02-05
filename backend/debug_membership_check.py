
import asyncio
from sqlmodel import select
from app.core.config import settings
from app.core.db import async_session_factory
from app.models.user import User
from app.models.iam import CompanyMembership

async def check_user_membership():
    print(f"Connecting to DB: {settings.DATABASE_URL}")
    async with async_session_factory() as session:
        statement = select(User).where(User.email == "tech.unclutr@gmail.com")
        result = await session.exec(statement)
        user = result.first()
        
        if not user:
            print("User not found!")
            return

        print(f"User Found: {user.email} (ID: {user.id})")
        print(f"User Current Company ID: {user.current_company_id}")

        mem_stmt = select(CompanyMembership).where(CompanyMembership.user_id == user.id)
        mem_result = await session.exec(mem_stmt)
        memberships = mem_result.all()
        
        print(f"Memberships Count: {len(memberships)}")
        for m in memberships:
            print(f" - Company ID: {m.company_id} | Role: {m.role}")

if __name__ == "__main__":
    asyncio.run(check_user_membership())
