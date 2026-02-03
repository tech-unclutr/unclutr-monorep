import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead

async def main():
    async with async_session_factory() as session:
        print("[*] Checking for QueueItem integrity violations...")
        
        # Check for QueueItems where campaign_id != lead.campaign_id
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id != CampaignLead.campaign_id)
        )
        
        result = await session.execute(stmt)
        violations = result.all()
        
        if violations:
            print(f"[!] FOUND {len(violations)} VIOLATIONS!")
            for item, lead in violations:
                print(f"  - QueueItem {item.id} (Campaign {item.campaign_id}) -> Lead {lead.id} (Campaign {lead.campaign_id})")
        else:
            print("[OK] No integrity violations found. All QueueItems match their Lead's Campaign.")
            
        # Get count of items in DIALING_INTENT status
        stmt2 = select(QueueItem).where(QueueItem.status == "DIALING_INTENT")
        res2 = await session.execute(stmt2)
        active_items = res2.scalars().all()
        print(f"[*] Total DIALING_INTENT items: {len(active_items)}")
        for i in active_items:
            # Get associated lead phone
            l_stmt = select(CampaignLead).where(CampaignLead.id == i.lead_id)
            l = (await session.execute(l_stmt)).scalars().first()
            phone = l.contact_number if l else "UNKNOWN"
            print(f"  - QueueItem {i.id} (Camp {i.campaign_id}) -> Lead {phone}")

if __name__ == "__main__":
    asyncio.run(main())
