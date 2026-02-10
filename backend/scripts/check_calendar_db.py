import asyncio
from uuid import UUID
from sqlmodel import select
from app.core.db import AsyncSession, engine
from app.models.calendar_connection import CalendarConnection

async def check_calendar_connections():
    async with AsyncSession(engine) as session:
        stmt = select(CalendarConnection)
        result = await session.execute(stmt)
        connections = result.scalars().all()
        
        print(f"Found {len(connections)} calendar connections")
        for conn in connections:
            print(f"ID: {conn.id}")
            print(f"Company ID: {conn.company_id}")
            print(f"User ID: {conn.user_id}")
            print(f"Provider: {conn.provider}")
            print(f"Status: {conn.status}")
            print(f"Credentials Scopes: {conn.credentials.get('scopes') if conn.credentials else 'None'}")
            print(f"Has Refresh Token: {'refresh_token' in conn.credentials if conn.credentials else 'No'}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_calendar_connections())
