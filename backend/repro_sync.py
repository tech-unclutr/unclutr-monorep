
import asyncio
from uuid import UUID
from app.core.db import AsyncSession, engine
from sqlalchemy import select
from app.models.campaign import Campaign
from app.models.company import Company
from app.models.calendar_connection import CalendarConnection
from app.services.intelligence.google_calendar_service import google_calendar_service

async def repro_sync():
    async with AsyncSession(engine) as session:
        # Find a campaign with execution windows
        stmt = select(Campaign).where(Campaign.execution_windows != None).limit(1)
        res = await session.execute(stmt)
        campaign = res.scalars().first()
        
        if not campaign:
            print("No campaign with windows found")
            return
            
        print(f"Reproduction for campaign: {campaign.id}")
        print(f"Name: {campaign.name}")
        print(f"Windows: {campaign.execution_windows}")
        
        # Check company timezone
        company = await session.get(Company, campaign.company_id)
        timezone_str = company.timezone if company else "UTC"
        print(f"Company Timezone: {timezone_str}")
        
        # Check calendar connection
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == campaign.company_id,
            CalendarConnection.provider == "google",
            CalendarConnection.status == "active"
        )
        res = await session.execute(stmt)
        calendar_conn = res.scalars().first()
        
        if not calendar_conn:
            print(f"No active Google connection for company {campaign.company_id}")
            return
            
        print(f"Found connection: {calendar_conn.id}")
        
        try:
            # Trigger sync
            events_created = await google_calendar_service.sync_campaign_windows(calendar_conn, campaign, timezone_str=timezone_str)
            print(f"Events created: {events_created}")
        except Exception as e:
            print(f"Sync failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(repro_sync())
