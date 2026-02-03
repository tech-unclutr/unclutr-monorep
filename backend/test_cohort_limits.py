import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.services.queue_warmer import QueueWarmer

# Database URL from environment or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://param@localhost:5432/postgres")

async def test_cohort_limits():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        campaign_id = "7b277bac-9157-4c01-9b6e-3b28b088e0b4"
        
        # Get campaign
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print("Campaign not found!")
            return
        
        print(f"\n=== Campaign: {campaign.name} ===")
        print(f"Cohort Config: {campaign.cohort_config}")
        print(f"Selected Cohorts: {campaign.selected_cohorts}")
        
        # Test cohort progress tracking
        print("\n=== Testing Cohort Progress ===")
        cohort_progress = await QueueWarmer._get_cohort_progress(session, campaign_id)
        print(f"Cohort Progress: {cohort_progress}")
        
        # Show current queue status
        print("\n=== Current Queue Status ===")
        stmt = (
            select(CampaignLead.cohort, QueueItem.status)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign_id)
        )
        result = await session.execute(stmt)
        rows = result.all()
        
        status_by_cohort = {}
        for cohort, status in rows:
            if cohort not in status_by_cohort:
                status_by_cohort[cohort] = {}
            status_by_cohort[cohort][status] = status_by_cohort[cohort].get(status, 0) + 1
        
        for cohort, statuses in status_by_cohort.items():
            print(f"\n{cohort}:")
            for status, count in statuses.items():
                print(f"  {status}: {count}")
        
        # Check which cohorts are eligible
        print("\n=== Cohort Eligibility ===")
        cohort_config = campaign.cohort_config or {}
        for cohort_name, target in cohort_config.items():
            completed = cohort_progress.get(cohort_name, 0)
            is_eligible = completed < target
            status_emoji = "✅" if is_eligible else "🛑"
            print(f"{status_emoji} {cohort_name}: {completed}/{target} completed - {'ELIGIBLE' if is_eligible else 'TARGET REACHED'}")

if __name__ == "__main__":
    asyncio.run(test_cohort_limits())
