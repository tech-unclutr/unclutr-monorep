
import asyncio
import uuid
import logging
from app.core.db import async_session_factory
from app.models.iam import CompanyMembership
from sqlmodel import select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_query():
    logger.info("Starting test query...")
    try:
        async with async_session_factory() as session:
            company_id = uuid.UUID("944e9ebf-e1bb-48f1-9137-c167c30dd7b5")
            user_id = "dev-user-123"
            
            logger.info(f"Checking membership for {user_id} in {company_id}")
            stmt = select(CompanyMembership).where(
                CompanyMembership.company_id == company_id,
                CompanyMembership.user_id == user_id
            )
            result = await session.execute(stmt)
            membership = result.scalars().first()
            
            logger.info(f"Result: {membership}")
            if membership:
                logger.info(f"Role: {membership.role}")
            else:
                logger.info("No membership found")
                
    except Exception as e:
        logger.error(f"Query failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_query())
