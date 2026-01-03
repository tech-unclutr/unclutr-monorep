import asyncio
import sys
from sqlalchemy import text
from app.core.db import get_session
from app.models.user import User
from sqlmodel import select

async def main():
    async for session in get_session():
        stmt = select(User)
        users = (await session.exec(stmt)).all()
        print(f"Found {len(users)} users.")
        
        from app.models.iam import CompanyMembership
        
        for u in users:
            print(f"User: {u.email}, ID: {u.id}, CompanyID: {u.current_company_id}")
            if not u.current_company_id:
                print(f"User {u.email} has NO company ID. Checking memberships...")
                mem_stmt = select(CompanyMembership).where(CompanyMembership.user_id == u.id)
                membership = (await session.exec(mem_stmt)).first()
                if membership:
                    print(f"Found membership in company: {membership.company_id}")
                    u.current_company_id = membership.company_id
                    session.add(u)
                    await session.commit()
                    await session.refresh(u)
                    print("Updated user current_company_id.")
                else:
                    print("No membership found.")
        
if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
