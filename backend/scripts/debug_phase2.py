
import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.services.intelligence.generators.velocity_generator import VelocityGenerator
from app.services.intelligence.generators.cashflow_generator import CashflowGenerator
from loguru import logger

async def debug_generators():
    BRAND_ID = UUID('bf69769d-d1fc-4d7a-9930-3b92f20500d9')
    logger.info(f"Debugging generators for Brand: {BRAND_ID}")
    
    async with async_session_factory() as session:
        # 1. Test Velocity Generator
        logger.info("Testing VelocityGenerator...")
        try:
            v_gen = VelocityGenerator()
            v_insight = await asyncio.wait_for(v_gen.run(session, BRAND_ID), timeout=10.0)
            logger.success(f"Velocity Insight: {v_insight}")
        except asyncio.TimeoutError:
            logger.error("VelocityGenerator TIMEOUT after 10s")
        except Exception as e:
            logger.error(f"VelocityGenerator Failed: {e}")

        # 2. Test Cashflow Generator
        logger.info("Testing CashflowGenerator...")
        try:
            c_gen = CashflowGenerator()
            c_insight = await asyncio.wait_for(c_gen.run(session, BRAND_ID), timeout=10.0)
            logger.success(f"Cashflow Insight: {c_insight}")
        except asyncio.TimeoutError:
            logger.error("CashflowGenerator TIMEOUT after 10s")
        except Exception as e:
            logger.error(f"CashflowGenerator Failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_generators())
