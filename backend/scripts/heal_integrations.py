import asyncio
import logging
from sqlalchemy import text
from app.core.db import engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("heal_integrations")

from app.core.db_repair import heal_integration_constraints

async def run_healing():
    logger.info("Starting integration sync healing process...")
    await heal_integration_constraints(engine)
    logger.info("Healing process completed.")

if __name__ == "__main__":
    asyncio.run(run_healing())
