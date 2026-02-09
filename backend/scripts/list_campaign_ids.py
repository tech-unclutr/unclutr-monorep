import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.future import select
from app.models.call_log import CallLog
from app.core.config import settings

from app.models.campaign_lead import CampaignLead

async def list_campaigns():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        stmt = select(CallLog.campaign_id).join(CampaignLead, CallLog.lead_id == CampaignLead.id).distinct().limit(10)
        result = await session.execute(stmt)
        ids = result.scalars().all()
        for cid in ids:
            print(cid)

if __name__ == '__main__':
    asyncio.run(list_campaigns())
