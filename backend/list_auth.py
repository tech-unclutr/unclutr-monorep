
import asyncio
from sqlalchemy import select
from app.core.db import async_session_factory
from app.models.user import User
from app.models.iam import CompanyMembership

async def list_auth_data():
    async with async_session_factory() as session:
        print("--- Users ---")
        users = await session.execute(select(User))
        for u in users.scalars().all():
            print(f"User: {u.id} - {u.email}")

        print("\n--- Memberships ---")
        memberships = await session.execute(select(CompanyMembership))
        for m in memberships.scalars().all():
            print(f"Membership: User={m.user_id} -> Company={m.company_id} (Role={m.role})")

if __name__ == "__main__":
    asyncio.run(list_auth_data())
