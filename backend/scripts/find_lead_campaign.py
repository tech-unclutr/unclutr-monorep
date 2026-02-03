import asyncio
import os
import sys
import argparse

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select
from app.core.db import async_session_factory
from app.models.campaign_lead import CampaignLead
from app.models.campaign import Campaign

async def main():
    if len(sys.argv) < 2:
        print("Usage: python find_lead_campaign.py <phone_number_part>")
        return

    phone_part = sys.argv[1]
    
    async with async_session_factory() as session:
        print(f"[*] Searching for leads with number containing '{phone_part}'...")
        
        stmt = select(CampaignLead).where(CampaignLead.contact_number.contains(phone_part))
        result = await session.execute(stmt)
        leads = result.scalars().all()
        
        if not leads:
            print("[!] No leads found.")
            return
            
        for lead in leads:
            # Fetch campaign name
            camp = await session.get(Campaign, lead.campaign_id)
            camp_name = camp.name if camp else "UNKNOWN"
            camp_status = camp.status if camp else "UNKNOWN"
            
            print(f"--- Found Lead ---")
            print(f"ID: {lead.id}")
            print(f"Name: {lead.customer_name}")
            print(f"Phone: {lead.contact_number}")
            print(f"Campaign ID: {lead.campaign_id}")
            print(f"Campaign Name: {camp_name}")
            print(f"Campaign Status: {camp_status}")
            print(f"Cohort: {lead.cohort}")
            print("------------------")

if __name__ == "__main__":
    asyncio.run(main())
