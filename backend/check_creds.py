
import asyncio
import os
import sys
from uuid import UUID
from sqlalchemy import select

# Add backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
sys.path.append(backend_path)

from app.core.db import get_session
from app.models.calendar_connection import CalendarConnection

async def main():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        conn = await session.get(CalendarConnection, UUID('8a5e7424-75da-43fd-a4b0-8f1efd09af09'))
        if conn:
            print(f"DB Client ID: {conn.credentials.get('client_id')}")
            print(f"DB Client Secret: {conn.credentials.get('client_secret')}")
        else:
            print("Connection not found")
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(main())
