import asyncio
import sys
import os
from uuid import UUID

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from sqlmodel import select

async def debug_execution_map():
    async for session in get_session():
        # 1. Get campaign
        stmt = select(Campaign).order_by(Campaign.updated_at.desc()).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        if not campaign:
            print("No campaign found.")
            return
            
        print(f"Active Campaign ID: {campaign.id}")

        # 2. Check for "Param"
        stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign.id)
        result = await session.execute(stmt)
        leads = result.scalars().all()
        
        for lead in leads:
            if "Param" in lead.customer_name:
                print(f"Lead Found: {lead.customer_name} (ID: {lead.id})")
                
                # Check Execution Map DIRECTLY by QueueItem
                q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id)
                q_result = await session.execute(q_stmt)
                q_item = q_result.scalars().first()
                
                if q_item:
                    print(f"  QueueItem ID: {q_item.id}, Status: {q_item.status}")
                    
                    exec_stmt = select(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id == q_item.id)
                    exec_result = await session.execute(exec_stmt)
                    exec_map = exec_result.scalars().first()
                    
                    if exec_map:
                        print(f"  BolnaExecutionMap Found!")
                        print(f"    ID: {exec_map.id}")
                        print(f"    Campaign ID: {exec_map.campaign_id}")
                        print(f"    Call Status: {exec_map.call_status}")
                        
                        if exec_map.campaign_id != campaign.id:
                            print(f"    [CRITICAL MISMATCH] Map Campaign ID {exec_map.campaign_id} != Active Campaign {campaign.id}")
                        else:
                            print(f"    [MATCH] Campaign IDs match.")
                    else:
                        print(f"  No BolnaExecutionMap found for QueueItem {q_item.id}")

if __name__ == "__main__":
    asyncio.run(debug_execution_map())
