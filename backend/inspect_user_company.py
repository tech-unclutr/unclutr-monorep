import asyncio
from sqlmodel import select
from app.core.db import get_session
from app.models.user import User
from app.models.iam import CompanyMembership

async def inspect_user_company():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2"
    user = await session.get(User, user_id)
    print(f"User: {user_id}")
    if user:
        print(f"current_company_id: {user.current_company_id}")
    
    stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
    result = await session.exec(stmt)
    memberships = result.all()
    
    for m in memberships:
        print(f"Membership: Company {m.company_id}, Role {m.role}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(inspect_user_company())
