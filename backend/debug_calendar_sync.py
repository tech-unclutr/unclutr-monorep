
import asyncio
import os
import sys
from uuid import UUID
from sqlalchemy import select, text

# Add backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
sys.path.append(backend_path)

from app.core.db import get_session
from app.models.campaign import Campaign
from app.models.calendar_connection import CalendarConnection
from app.services.intelligence.google_calendar_service import google_calendar_service

async def main():
    print("--- DEBUG: Starting Calendar Sync Diagnostic ---")
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # 1. Fetch Latest Campaign
        # We assume the user is the one running this, or just pick the latest created campaign
        stmt = select(Campaign).order_by(Campaign.created_at.desc()).limit(1)
        res = await session.execute(stmt)
        campaign = res.scalars().first()
        
        if not campaign:
            print("CRITICAL: No campaigns found in DB.")
            return

        print(f"Target Campaign: {campaign.name} ({campaign.id})")
        print(f"Company ID: {campaign.company_id}")
        print(f"User ID: {campaign.user_id}")
        print(f"Execution Windows (DB): {campaign.execution_windows}")
        
        if not campaign.execution_windows:
            print("WARNING: Execution windows are EMPTY in DB.")
        
        # 2. Check Calendar Connection
        conn_stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == campaign.company_id,
            CalendarConnection.provider == 'google'
        )
        conn_res = await session.execute(conn_stmt)
        conn = conn_res.scalars().first()
        
        if not conn:
            print("CRITICAL: No Google Calendar connection found for this company.")
            return

        print(f"Calendar Connection Found: {conn.id}")
        print(f"Status: {conn.status}")
        print(f"Scopes: {conn.credentials.get('scopes')}")
        
        # Check Permissions
        required_scope = 'https://www.googleapis.com/auth/calendar.events'
        has_scope = required_scope in conn.credentials.get('scopes', [])
        print(f"Has Write Scope ('{required_scope}'): {has_scope}")
        
        # 3. Simulate Sync
        print("\n--- Simulating Sync ---")
        try:
            # We import Company to get timezone
            from app.models.company import Company
            company = await session.get(Company, campaign.company_id)
            timezone_str = company.timezone or "UTC"
            print(f"Company Timezone: {timezone_str}")

            events_created = await google_calendar_service.sync_campaign_windows(conn, campaign, timezone_str=timezone_str)
            print(f"SUCCESS: Created {events_created} events.")
        except Exception as e:
            print(f"ERROR During Sync: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"Unexpected Error: {e}")
    finally:
        await session.close()
        print("\n--- DEBUG: Finished ---")

if __name__ == "__main__":
    asyncio.run(main())
