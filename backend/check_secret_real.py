
import asyncio
import os
import sys
from uuid import UUID

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
            secret = conn.credentials.get('client_secret')
            print(f"REAL SECRET: {secret}")
        else:
            print("Connection not found")
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(main())
