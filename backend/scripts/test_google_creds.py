import asyncio
import google.oauth2.credentials
from googleapiclient.discovery import build
from sqlmodel import select
from app.core.db import AsyncSession, engine
from app.models.calendar_connection import CalendarConnection
from app.core.config import settings

async def test_google_creds():
    async with AsyncSession(engine) as session:
        stmt = select(CalendarConnection).where(CalendarConnection.provider == "google")
        result = await session.execute(stmt)
        conn = result.scalars().first()
        
        if not conn:
            print("No Google connection found")
            return

        print(f"Testing connection for User: {conn.user_id}")
        
        creds = google.oauth2.credentials.Credentials(
            token=conn.credentials.get("token"),
            refresh_token=conn.credentials.get("refresh_token"),
            token_uri=conn.credentials.get("token_uri"),
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=conn.credentials.get("scopes"),
        )

        try:
            service = build('calendar', 'v3', credentials=creds)
            print("Fetching calendar list...")
            calendar_list = service.calendarList().list().execute()
            print(f"Successfully fetched {len(calendar_list.get('items', []))} calendars")
            for cal in calendar_list.get('items', []):
                print(f"- {cal.get('summary')} ({cal.get('id')})")
        except Exception as e:
            print(f"Error testing credentials: {e}")

if __name__ == "__main__":
    asyncio.run(test_google_creds())
