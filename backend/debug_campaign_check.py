
import asyncio
import uuid
import logging
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from sqlmodel import select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_campaign():
    campaign_id_str = "55271330-8b3d-4c68-ba39-6bd59f0abee9"
    logger.info(f"Checking for campaign {campaign_id_str}...")
    try:
        async with async_session_factory() as session:
            # 1. Check by ID only (ignore ownership)
            try:
                c_uuid = uuid.UUID(campaign_id_str)
                campaign = await session.get(Campaign, c_uuid)
                
                if campaign:
                    logger.info(f"FOUND Campaign: {campaign.id}")
                    logger.info(f"  Owner User: {campaign.user_id}")
                    logger.info(f"  Company: {campaign.company_id}")
                    logger.info(f"  Status: {campaign.status}")
                else:
                    logger.warning("Campaign NOT FOUND by ID.")
                    
                    # Dump all campaigns to see what's there
                    stmt = select(Campaign)
                    result = await session.execute(stmt)
                    all_c = result.scalars().all()
                    logger.info(f"Total campaigns in DB: {len(all_c)}")
                    for c in all_c:
                         logger.info(f" - {c.id} ({c.status})")
                         
            except ValueError:
                 logger.error("Invalid UUID string")

    except Exception as e:
        logger.error(f"Query failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_campaign())
