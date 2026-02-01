import asyncio
import logging
from uuid import UUID
from app.core.db import get_session
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from sqlmodel import select, func, case, desc

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_campaign_fetch():
    print("--- Starting Campaign Fetch Debug ---")
    async for session in get_session():
        # 1. Fetch one campaign to see what we are working with
        stmt = select(Campaign).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if not campaign:
            print("No campaigns found in DB.")
            return

        print(f"Found Campaign: {campaign.name} (ID: {campaign.id})")
        print(f"Company ID: {campaign.company_id}")
        
        # 2. Replicate the CURRENT inefficient logic from list_campaigns
        print("\n--- Current Logic Simulation ---")
        try:
            # Stats query
            stats_stmt = select(
                func.count(CampaignLead.id).label("total"),
                func.sum(case((CampaignLead.status == "COMPLETED", 1), else_=0)).label("completed"),
                func.sum(case((CampaignLead.status.in_(["INITIATED", "RINGING", "IN_PROGRESS"]), 1), else_=0)).label("in_progress")
            ).where(CampaignLead.campaign_id == campaign.id)
            
            stats_result = await session.execute(stats_stmt)
            stats = stats_result.one()
            print(f"Stats Result: Total={stats.total}, Completed={stats.completed}, In Progress={stats.in_progress}")
            
            # Dict conversion
            campaign_dict = campaign.dict()
            campaign_dict["stats"] = {
                "total_leads": stats.total or 0,
                "completed_leads": stats.completed or 0,
                "in_progress_leads": stats.in_progress or 0
            }
            print("Enriched Campaign Keys:", campaign_dict.keys())
            
        except Exception as e:
            print(f"Error in Current Logic: {e}")

        # 3. Test Optimized Query logic
        print("\n--- Optimized Query Simulation ---")
        try:
            stmt_opt = (
                select(
                    Campaign,
                    func.count(CampaignLead.id).label("total"),
                    func.sum(case((CampaignLead.status == "COMPLETED", 1), else_=0)).label("completed"),
                    func.sum(case((CampaignLead.status.in_(["INITIATED", "RINGING", "IN_PROGRESS"]), 1), else_=0)).label("in_progress")
                )
                .outerjoin(CampaignLead, CampaignLead.campaign_id == Campaign.id)
                .where(Campaign.id == campaign.id) # Filter by this campaign for direct comparison
                .group_by(Campaign.id)
            )
            
            result_opt = await session.execute(stmt_opt)
            row = result_opt.first()
            if row:
                camp_opt, total, completed, in_progress = row
                print(f"Optimized Result: Name={camp_opt.name}, Total={total}, Completed={completed}, In Progress={in_progress}")
            else:
                print("Optimized query returned no results.")
                
        except Exception as e:
            print(f"Error in Optimized Logic: {e}")
            
        break

if __name__ == "__main__":
    asyncio.run(debug_campaign_fetch())
