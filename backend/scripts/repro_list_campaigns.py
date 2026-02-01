import sys
import os
import asyncio
from sqlalchemy import select, func, case, desc
from uuid import UUID

# Add logical path components
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead

async def main():
    async with async_session_factory() as session:
        company_id = UUID("28233392-a23b-4f2d-b051-fb9d8cc7c97b")
        limit = 10
        offset = 0
        
        print(f"Testing list_campaigns query for Company: {company_id}")
        
        stmt = (
            select(
                Campaign,
                func.count(CampaignLead.id).label("total"),
                func.sum(case((CampaignLead.status == "COMPLETED", 1), else_=0)).label("completed"),
                func.sum(case((CampaignLead.status.in_(["INITIATED", "RINGING", "IN_PROGRESS"]), 1), else_=0)).label("in_progress")
            )
            .outerjoin(CampaignLead, CampaignLead.campaign_id == Campaign.id)
            .where(Campaign.company_id == company_id)
            .group_by(Campaign.id)
            .order_by(desc(Campaign.created_at))
            .offset(offset)
            .limit(limit)
        )
        
        try:
            result = await session.execute(stmt)
            rows = result.all()
            print(f"Query returned {len(rows)} rows.")
            
            for row in rows:
                campaign, total, completed, in_progress = row
                print(f"Campaign: {campaign.name} (ID: {campaign.id})")
                print(f"  Stats: Total={total}, Completed={completed}, InProgress={in_progress}")
                
        except Exception as e:
            print(f"Query FAILED: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
