import asyncio
from typing import List
from datetime import datetime, timezone
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger
from sqlmodel import select
from app.core.db import get_session
from app.models.company import Company
from app.models.integration import Integration, IntegrationStatus
from app.services.shopify.tasks import run_shopify_sync_task

scheduler = AsyncIOScheduler()

async def check_and_trigger_nightly_sweeps():
    """
    Runs every hour.
    Checks for companies where local time is 09:00, 14:00, or 19:00.
    Triggers delta sync for their integrations.
    """
    logger.info("Scheduler: Checking for scheduled reconciliation windows...")
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # Get all companies
        stmt = select(Company)
        companies = (await session.execute(stmt)).scalars().all()
        
        target_hours = [9, 14, 19] # Local hours to trigger sync
        triggered_count = 0
        
        for company in companies:
            if not company.timezone:
                continue
                
            try:
                tz = pytz.timezone(company.timezone)
                local_now = datetime.now(tz)
                
                if local_now.hour in target_hours:
                    # Trigger Sync for this company's integrations
                    logger.info(f"Scheduler: Triggering sync for {company.brand_name} (Local Time: {local_now.strftime('%H:%M')})")
                    
                    int_stmt = select(Integration).where(
                        Integration.company_id == company.id,
                        Integration.status == IntegrationStatus.ACTIVE
                    )
                    integrations = (await session.execute(int_stmt)).scalars().all()
                    
                    for integration in integrations:
                        # Fire and forget task
                        asyncio.create_task(run_shopify_sync_task(integration.id, delta=True))
                        triggered_count += 1
                        
            except Exception as e:
                logger.warning(f"Scheduler: Failed to process company {company.id}: {e}")
                
        logger.info(f"Scheduler: Triggered {triggered_count} sync jobs.")
        
    finally:
        await session.close()

async def prune_old_raw_payloads():
    """
    Runs daily.
    Clears raw_payload from Order/Inventory tables for records older than 90 days.
    Does NOT delete the record, just the heavy JSON blob.
    """
    logger.info("Scheduler: Pruning old raw payloads...")
    from app.models.shopify.order import ShopifyOrder
    from app.models.shopify.inventory import ShopifyInventoryItem, ShopifyInventoryLevel
    from sqlalchemy import text
    from datetime import timedelta
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # Define 90 days ago
        cutoff = datetime.now(timezone.utc) - timedelta(days=90)
        
        # 1. Orders
        stmt = text("UPDATE shopify_order SET raw_payload = '{}'::jsonb WHERE shopify_created_at < :cutoff")
        await session.execute(stmt, {"cutoff": cutoff})
        
        # 2. Inventory Items (Updated At)
        # Note: Inventory doesn't have created_at usually, we use updated_at
        stmt2 = text("UPDATE shopify_inventory_item SET raw_payload = '{}'::jsonb WHERE updated_at < :cutoff")
        await session.execute(stmt2, {"cutoff": cutoff})
        
        # 3. Inventory Levels
        stmt3 = text("UPDATE shopify_inventory_level SET raw_payload = '{}'::jsonb WHERE updated_at < :cutoff")
        await session.execute(stmt3, {"cutoff": cutoff})
        
        await session.commit()
        logger.info("Scheduler: Pruning complete.")
        
    except Exception as e:
        logger.error(f"Pruning failed: {e}")
    finally:
        await session.close()

def start_scheduler():
    if not scheduler.running:
        # Run at the top of every hour
        trigger = CronTrigger(minute=0)
        scheduler.add_job(check_and_trigger_nightly_sweeps, trigger, id="nightly_sweep", replace_existing=True)
        
        # Run pruning every day at 04:30 AM UTC
        prune_trigger = CronTrigger(hour=4, minute=30)
        scheduler.add_job(prune_old_raw_payloads, prune_trigger, id="prune_payloads", replace_existing=True)
        
        scheduler.start()
        logger.info("Scheduler started. Jobs registered: 'nightly_sweep' (Hourly), 'prune_payloads' (Daily).")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down.")
