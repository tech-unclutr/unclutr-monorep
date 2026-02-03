import asyncio
from uuid import UUID
from sqlmodel import select, delete, update
from app.api.deps import get_session
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.queue_item import QueueItem
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.services.queue_warmer import QueueWarmer

async def reset_campaign(campaign_id_str: str):
    campaign_id = UUID(campaign_id_str)
    async for session in get_session():
        # 1. Fetch Campaign
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print(f"Campaign {campaign_id} not found")
            return

        print(f"Cleaning execution data for campaign: {campaign.name} ({campaign.id})")

        # 2. Delete existing BolnaExecutionMaps (Agent execution logs)
        exec_stmt = delete(BolnaExecutionMap).where(BolnaExecutionMap.campaign_id == campaign_id)
        await session.execute(exec_stmt)
        print(f"Deleted BolnaExecutionMap entries for campaign {campaign_id}")

        # 3. Delete existing QueueItems (Agent queue)
        q_item_stmt = delete(QueueItem).where(QueueItem.campaign_id == campaign_id)
        await session.execute(q_item_stmt)
        print(f"Deleted QueueItem entries for campaign {campaign_id}")
        
        # 3b. Reset Campaign Leads (User Data - Status Only)
        # We need to reset statuses to PENDING so they can be picked up again
        # We also clear outcome if any
        stmt = (
            update(CampaignLead)
            .where(CampaignLead.campaign_id == campaign_id)
            .values(status="PENDING")
        )
        await session.execute(stmt)
        print(f"Reset Campaign Leads to PENDING")

        # 4. Cleanup Campaign Execution Fields (Agent State)
        # Clear fields populated by agent to remove "corruption"
        campaign.status = "ACTIVE"
        
        # Legacy fields are removed from model, so we skip clearing them.
        # campaign.bolna_* fields are gone.
        
        # Reset Meta Data flags
        if campaign.meta_data:
             meta = dict(campaign.meta_data)
             if "window_expired" in meta:
                 del meta["window_expired"]
             campaign.meta_data = meta
        
        session.add(campaign)
        
        await session.commit()
        print(f"Campaign {campaign_id} reset to ACTIVE status and execution fields cleared")

        # 5. Trigger QueueWarmer to replenish
        print("Triggering QueueWarmer...")
        await QueueWarmer.check_and_replenish(campaign_id, session)
        print("QueueWarmer triggered successfully")

if __name__ == "__main__":
    import sys
    cid = "7b277bac-9157-4c01-9b6e-3b28b088e0b4"
    if len(sys.argv) > 1:
        cid = sys.argv[1]
    asyncio.run(reset_campaign(cid))
