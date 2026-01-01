import asyncio
import logging
from sqlalchemy import text
from app.core.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_schema():
    async with engine.begin() as conn:
        dialect = conn.dialect.name
        type_str = "UUID" if dialect == "postgresql" else "CHAR(36)"
        
        # Helper to check column existence safely
        async def has_column(table, column):
            if dialect == "sqlite":
                # For SQLite, use pragma
                result = await conn.execute(text(f"PRAGMA table_info({table})"))
                rows = result.fetchall()
                for row in rows:
                    if row[1] == column:
                        return True
                return False
            else:
                # For Postgres
                result = await conn.execute(text(f"SELECT 1 FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'"))
                return result.first() is not None

        # Check Integration table
        logger.info("Checking 'integrations' table...")
        if await has_column("integrations", "company_id"):
             logger.info("'integrations.company_id' already exists.")
        else:
            logger.info("'integrations.company_id' missing. Adding it...")
            try:
                await conn.execute(text(f"ALTER TABLE integrations ADD COLUMN company_id {type_str}"))
                await conn.execute(text("CREATE INDEX ix_integrations_company_id ON integrations (company_id)"))
                logger.info("Added 'company_id' to 'integrations'.")
            except Exception as e:
                logger.error(f"Failed to add column to integrations: {e}")

        # Check IntegrationMetrics table
        logger.info("Checking 'integration_metrics' table...")
        if await has_column("integration_metrics", "company_id"):
             logger.info("'integration_metrics.company_id' already exists.")
        else:
            logger.info("'integration_metrics.company_id' missing. Adding it...")
            try:
                await conn.execute(text(f"ALTER TABLE integration_metrics ADD COLUMN company_id {type_str}"))
                await conn.execute(text("CREATE INDEX ix_integration_metrics_company_id ON integration_metrics (company_id)"))
                logger.info("Added 'company_id' to 'integration_metrics'.")
            except Exception as e:
                logger.error(f"Failed to add column to integration_metrics: {e}")

        # Check Company table for timezone
        logger.info("Checking 'company' table for 'timezone'...")
        if await has_column("company", "timezone"):
             logger.info("'company.timezone' already exists.")
        else:
            logger.info("'company.timezone' missing. Adding it...")
            try:
                # timezone is NOT NULL in model but we must add as nullable or with default for existing rows
                # We'll add with default 'UTC'
                await conn.execute(text(f"ALTER TABLE company ADD COLUMN timezone VARCHAR(255) DEFAULT 'UTC'"))
                logger.info("Added 'timezone' to 'company'.")
            except Exception as e:
                logger.error(f"Failed to add column to company: {e}")

if __name__ == "__main__":
    asyncio.run(fix_schema())
