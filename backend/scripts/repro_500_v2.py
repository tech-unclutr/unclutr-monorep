
import asyncio
from uuid import UUID
from sqlalchemy import select
from app.core.db import get_session
from app.models.calendar_connection import CalendarConnection
from app.services.intelligence.google_calendar_service import google_calendar_service
from app.models.user import User

async def reproduce():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        company_id = UUID("d47da809-b1aa-49c3-ace7-624aeddad9bd")
        user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2"
        
        print(f"Checking CalendarConnection for company {company_id} and user {user_id}")
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == company_id,
            CalendarConnection.user_id == user_id,
            CalendarConnection.provider == "google"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()
        
        if not conn:
            print("No connection found")
            return
            
        print(f"Connection found, status: {conn.status}")
        
        if conn.status != "active":
            print("Connection not active")
            return
            
        scopes = conn.credentials.get("scopes", [])
        writable = 'https://www.googleapis.com/auth/calendar.events' in scopes
        print(f"Writable: {writable}")
        
        try:
            print("Fetching availability...")
            all_busy = await google_calendar_service.get_availability(conn)
            print(f"Fetched {len(all_busy)} busy slots")
        except Exception as e:
            import traceback
            print("Failed to fetch availability:")
            print(e)
            print(traceback.format_exc())
            
    except Exception as e:
        import traceback
        print("Logic failed with exception:")
        print(e)
        print(traceback.format_exc())
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(reproduce())
