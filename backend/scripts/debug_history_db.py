import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.future import select
from app.models.call_log import CallLog
from app.models.campaign_lead import CampaignLead
from app.core.config import settings
from uuid import UUID

async def debug_db():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        cid = UUID('d256e606-26cf-426c-aa33-454e598012ff')
        stmt = select(CallLog).where(CallLog.campaign_id == cid)
        result = await session.execute(stmt)
        logs = result.scalars().all()
        print(f"Logs for {cid}: {len(logs)}")
        
        # Check join
        stmt = select(CallLog, CampaignLead).join(CampaignLead, CallLog.lead_id == CampaignLead.id).where(CallLog.campaign_id == cid)
        result = await session.execute(stmt)
        items = result.all()
        print(f"Logs with Leads for {cid}: {len(items)}")

        # Find any campaign with history
        stmt = select(CallLog.campaign_id).join(CampaignLead, CallLog.lead_id == CampaignLead.id).limit(1)
        result = await session.execute(stmt)
        best_cid = result.scalars().first()
        print(f"TRY THIS CID: {best_cid}")

if __name__ == '__main__':
    asyncio.run(debug_db())
