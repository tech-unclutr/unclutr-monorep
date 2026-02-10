
import asyncio
from uuid import UUID
from sqlalchemy import select, func, case, and_, not_
from app.core.db import get_session
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.user import User

async def reproduce():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        company_id = UUID("d47da809-b1aa-49c3-ace7-624aeddad9bd")
        
        print(f"Listing campaigns for company {company_id}")
        
        stmt = (
            select(
                Campaign,
                func.count(CampaignLead.id).label("total"),
                func.sum(case((CampaignLead.status == "COMPLETED", 1), else_=0)).label("completed"),
                func.sum(case((CampaignLead.status.in_(["INITIATED", "RINGING", "IN_PROGRESS"]), 1), else_=0)).label("in_progress"),
                func.sum(case((CampaignLead.status.not_in(["PENDING", "QUEUED", "READY", "SCHEDULED"]), 1), else_=0)).label("execution_count")
            )
            .outerjoin(CampaignLead, CampaignLead.campaign_id == Campaign.id)
            .where(Campaign.company_id == company_id)
            .where(
                not_(
                    and_(
                        Campaign.status == "DRAFT",
                        Campaign.name.startswith("Campaign - "),
                        Campaign.brand_context == None,
                        Campaign.customer_context == None
                    )
                )
            )
            .group_by(Campaign.id)
            .limit(10)
        )
        
        result = await session.execute(stmt)
        rows = result.all()
        print(f"Found {len(rows)} campaigns")
        
        for row in rows:
            campaign, total, completed, in_progress, execution_count = row
            print(f"Campaign: {campaign.id}, Name: {campaign.name}, Stats: total={total}, completed={completed}")
            
    except Exception as e:
        import traceback
        print("Campaign list failed with exception:")
        print(e)
        print(traceback.format_exc())
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(reproduce())
