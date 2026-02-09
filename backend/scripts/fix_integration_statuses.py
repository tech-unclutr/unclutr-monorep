import asyncio
import logging
from sqlalchemy import text
from app.core.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_integration_statuses():
    """
    Normalizes all 'status' values in the 'integration' table to uppercase.
    This fixes the SQLAlchemy LookupError caused by lowercase 'inactive' or 'active' values.
    """
    logger.info("Starting integration status normalization...")
    
    async with engine.begin() as conn:
        # Check current values
        check_query = text("SELECT DISTINCT status FROM integration")
        result = await conn.execute(check_query)
        current_statuses = [row[0] for row in result.all()]
        logger.info(f"Current unique statuses in DB: {current_statuses}")
        
        # Perform update
        update_query = text("""
            UPDATE integration 
            SET status = UPPER(status) 
            WHERE status != UPPER(status)
        """)
        
        result = await conn.execute(update_query)
        rows_affected = result.rowcount
        
        # Verify update
        verify_query = text("SELECT DISTINCT status FROM integration")
        verify_result = await conn.execute(verify_query)
        new_statuses = [row[0] for row in verify_result.all()]
        
        logger.info(f"Update complete. Rows affected: {rows_affected}")
        logger.info(f"New unique statuses in DB: {new_statuses}")

if __name__ == "__main__":
    asyncio.run(fix_integration_statuses())
