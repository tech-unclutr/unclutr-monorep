import asyncio
from datetime import datetime, timezone, timedelta
from app.core.db import AsyncSession, engine
from app.models.calendar_connection import CalendarConnection
from app.services.intelligence.google_calendar_service import google_calendar_service
from sqlmodel import select

async def test_availability():
    async with AsyncSession(engine) as session:
        stmt = select(CalendarConnection).where(CalendarConnection.provider == "google")
        result = await session.execute(stmt)
        conn = result.scalars().first()
        
        if not conn:
            print("No Google connection found")
            return

        print(f"Fetching availability for connection: {conn.id}")
        try:
            # Re-implementing parts of get_availability to see raw data
            import google.oauth2.credentials
            from googleapiclient.discovery import build
            import asyncio
            
            from app.core.config import settings
            creds = google.oauth2.credentials.Credentials(
                token=conn.credentials.get("token"),
                refresh_token=conn.credentials.get("refresh_token"),
                token_uri=conn.credentials.get("token_uri"),
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                scopes=conn.credentials.get("scopes"),
            )
            service = build('calendar', 'v3', credentials=creds)
            
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            time_min = today_start.isoformat().replace('+00:00', 'Z')
            time_max = (today_start + timedelta(days=7)).isoformat().replace('+00:00', 'Z')
            
            print(f"Time range: {time_min} to {time_max}")
            
            calendar_list = service.calendarList().list().execute()
            calendar_ids = [c['id'] for c in calendar_list.get('items', []) if c.get('accessRole') in ['owner', 'writer', 'reader']]
            
            print(f"Calendars: {calendar_ids}")
            
            for cal_id in calendar_ids:
                print(f"\nChecking calendar: {cal_id}")
                events_result = service.events().list(
                    calendarId=cal_id,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                events = events_result.get('items', [])
                print(f"Found {len(events)} events")
                for event in events:
                    start = event.get('start', {}).get('dateTime') or event.get('start', {}).get('date')
                    end = event.get('end', {}).get('dateTime') or event.get('end', {}).get('date')
                    transparency = event.get('transparency', 'opaque')
                    print(f"- {event.get('summary')}: {start} to {end} (Transparency: {transparency})")

        except Exception as e:
            print(f"Error fetching availability: {e}")

if __name__ == "__main__":
    asyncio.run(test_availability())
