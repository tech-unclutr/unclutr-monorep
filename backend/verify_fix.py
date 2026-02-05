
import asyncio
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.campaign_lead import CampaignLead
from app.api.v1.endpoints.execution import get_campaign_realtime_status_internal

async def main():
    async with async_session_factory() as session:
        # 1. Find the lead "Param"
        stmt = select(CampaignLead).where(CampaignLead.customer_name.ilike("%Param%"))
        result = await session.execute(stmt)
        lead = result.scalars().first()

        if not lead:
            print("No lead found with name 'Param'")
            return

        print(f"Checking API response for Campaign: {lead.campaign_id}")
        
        # 2. Call the internal API function
        status_data = await get_campaign_realtime_status_internal(lead.campaign_id, session, trigger_warmer=False)
        
        upcoming_leads = status_data.get("upcoming_leads", [])
        print(f"Upcoming Leads Count: {len(upcoming_leads)}")
        
        found = False
        for l in upcoming_leads:
            if l["lead_id"] == lead.id:
                found = True
                print(f"SUCCESS: Found Lead '{l['name']}' in Upcoming Queue!")
                print(f"  Status in response: {l.get('status')}")
                break
        
        if not found:
            print("FAILURE: Lead 'Param' NOT found in Upcoming Queue response.")
            print("Leads found:", [l["name"] for l in upcoming_leads])

if __name__ == "__main__":
    asyncio.run(main())
