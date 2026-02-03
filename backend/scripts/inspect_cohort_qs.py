import asyncio
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import engine
from app.models.campaign import Campaign

async def inspect():
    async with AsyncSession(engine) as session:
        # Retention Feb 2026 ID from previous output: a390371e-28a4-43a9-b8e3-befc774011cb
        campaign_id = UUID('a390371e-28a4-43a9-b8e3-befc774011cb')
        campaign = await session.get(Campaign, campaign_id)
        print(f"Name: {campaign.name}")
        print(f"Cohort Questions: {campaign.cohort_questions}")
        print(f"Selected Cohorts: {campaign.selected_cohorts}")
        print(f"Cohort Config: {campaign.cohort_config}")
        print(f"Preliminary Questions (Global): {campaign.preliminary_questions}")

if __name__ == "__main__":
    asyncio.run(inspect())
