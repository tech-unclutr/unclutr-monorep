
import asyncio
from sqlmodel import select
from app.core.db import get_session
from app.models.user import User
from app.models.company import Company
from app.models.iam import CompanyMembership

async def check_data():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("--- USERS ---")
    users = (await session.exec(select(User))).all()
    for u in users:
        print(f"User: {u.email} (ID: {u.id}) - Current Company: {u.current_company_id}")

    print("\n--- COMPANIES ---")
    companies = (await session.exec(select(Company))).all()
    for c in companies:
        print(f"Company: {c.name} (ID: {c.id}) - Legal: {c.legal_name}")

    print("\n--- MEMBERSHIPS ---")
    memberships = (await session.exec(select(CompanyMembership))).all()
    for m in memberships:
        print(f"User {m.user_id} is in Company {m.company_id} as {m.role}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(check_data())
