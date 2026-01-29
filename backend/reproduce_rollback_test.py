
import asyncio
import uuid
import logging
from app.core.db import async_session_factory
from app.models.campaign import Campaign

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_rollback_behavior():
    logger.info("Starting rollback reproduction test...")
    created_id = None
    
    # 1. Simulate Request Lifecycle
    try:
        async with async_session_factory() as session:
            # Create Campaign
            campaign = Campaign(
                company_id=uuid.uuid4(),
                user_id="test-user-rollback",
                name="Rollback Test Campaign",
                status="INITIATED",
                phone_number="+1234567890"
            )
            session.add(campaign)
            await session.commit()
            await session.refresh(campaign)
            created_id = campaign.id
            logger.info(f"Campaign created/committed: {created_id}")
            
            # Simulate Error occurring AFTER commit
            raise ValueError("Simulated Error after commit")
            
    except ValueError as e:
        logger.info(f"Caught expected error: {e}")
    except Exception as e:
        logger.error(f"Caught unexpected error: {e}")
        
    # 2. Check Persistence in NEW session
    logger.info("Checking persistence in new session...")
    async with async_session_factory() as session:
        if created_id:
            c = await session.get(Campaign, created_id)
            if c:
                logger.info(f"SUCCESS: Campaign {created_id} persisted despite subsequent error.")
            else:
                logger.error(f"FAILURE: Campaign {created_id} vanished! Rollback occurred?")
        else:
            logger.error("Failed to create campaign initially.")

if __name__ == "__main__":
    asyncio.run(test_rollback_behavior())
