
import asyncio
from sqlalchemy import select
from app.core.db import get_session
from app.models.company import Company
from app.models.calendar_connection import CalendarConnection

async def check():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        stmt = select(Company)
        result = await session.execute(stmt)
        companies = result.scalars().all()
        print(f"Companies found: {len(companies)}")
        for c in companies:
            print(f"ID: {c.id}, Name: {c.brand_name}")
            
        stmt = select(CalendarConnection)
        result = await session.execute(stmt)
        conns = result.scalars().all()
        print(f"Calendar Connections found: {len(conns)}")
        for conn in conns:
            print(f"ID: {conn.id}, Company ID: {conn.company_id}, User ID: {conn.user_id}, Status: {conn.status}")
            
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(check())
