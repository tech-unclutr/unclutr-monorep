import asyncio
from uuid import UUID
from sqlmodel import select
from app.core.db import AsyncSession, engine
from app.models.calendar_connection import CalendarConnection
from app.models.campaign import Campaign
from app.services.intelligence.google_calendar_service import google_calendar_service

async def manual_sync(campaign_id_str, timezone_str="Asia/Kolkata"):
    campaign_id = UUID(campaign_id_str)
    async with AsyncSession(engine) as session:
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print("Campaign not found")
            return

        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == campaign.company_id,
            CalendarConnection.provider == "google",
            CalendarConnection.status == "active"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()
        
        if not conn:
            print("No active Google connection found")
            return

        print(f"Manually syncing campaign: {campaign.name} (TZ: {timezone_str})")
        count = await google_calendar_service.sync_campaign_windows(conn, campaign, timezone_str=timezone_str)
        print(f"Sync reported {count} events created")

if __name__ == "__main__":
    # Using the first campaign ID from previous check
    asyncio.run(manual_sync("404c3dae-6b40-4358-9115-f6ddfd8deb0b"))
