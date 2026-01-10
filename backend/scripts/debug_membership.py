
import asyncio
from uuid import UUID
from sqlmodel import select
from app.core.db import get_session
from app.models.iam import CompanyMembership
from app.models.user import User

async def check_membership():
    user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2"
    company_id_str = "ae9485b1-63f3-4f0d-aa7a-26853a79b1e7"
    company_id = UUID(company_id_str)

    async for session in get_session():
        # Check User
        user = await session.get(User, user_id)
        print(f"User found: {user is not None}")
        if user:
            print(f"User email: {user.email}")
        
        # Check Membership
        stmt = select(CompanyMembership).where(
            CompanyMembership.company_id == company_id,
            CompanyMembership.user_id == user_id
        )
        membership = (await session.exec(stmt)).first()
        
        print(f"Membership exists: {membership is not None}")
        if membership:
            print(f"Role: {membership.role}")
        
        break

if __name__ == "__main__":
    asyncio.run(check_membership())
