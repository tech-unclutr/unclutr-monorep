import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select, desc

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem

async def reset_campaign():
    print("--- Resetting Campaign State ---")
    
    # Fix for asyncpg prepared statement error
    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"server_settings": {"jit": "off"}} # sometimes helps, but statement_cache_size is key
    )
    # Actually, pass statement_cache_size=0 to connect_args for asyncpg
    # but create_async_engine passes kwargs to dialect
    # For asyncpg:
    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"statement_cache_size": 0}
    )
    async with AsyncSession(engine) as session:
        # 1. Get latest COMPLETED campaign
        stmt = select(Campaign).order_by(desc(Campaign.created_at)).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalar_one_or_none()
        
        if not campaign:
            print("No campaigns found.")
            return

        print(f"Target Campaign: {campaign.name} ({campaign.id})")
        print(f"Current Status: {campaign.status}")
        
        # 2. Reset Campaign Status
        if campaign.status == "COMPLETED":
            print(f"Resetting Campaign {campaign.id} to IN_PROGRESS...")
            campaign.status = "IN_PROGRESS"
            session.add(campaign)
        else:
            print(f"Campaign is not COMPLETED (Status: {campaign.status}). Skipping status reset.")

        # 3. Reset Failed Queue Items
        # Fetch FAILED items
        stmt = select(QueueItem).where(QueueItem.campaign_id == campaign.id).where(QueueItem.status == "FAILED")
        result = await session.execute(stmt)
        failed_items = result.scalars().all()
        
        print(f"Found {len(failed_items)} FAILED items.")
        
        for item in failed_items:
            print(f"  Resetting Item {item.id} (Lead {item.lead_id}) -> READY")
            item.status = "READY"
            # Optional: Decrement execution count if you want to treat the failed attempt as 'didn't happen'
            # But usually safer to just let it consume a retry slot unless we are sure.
            # Given it was a config error, let's reset execution_count so they get a fair shot?
            # If execution_count is 1, and we reset to 0, it's like new.
            # The previous attempt failed instantly.
            # Let's decrement by 1 if > 0.
            if item.execution_count > 0:
                 item.execution_count -= 1
            
            session.add(item)
            
        await session.commit()
        print("Reset complete.")

if __name__ == "__main__":
    if sys.platform == 'win32':
         asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(reset_campaign())
