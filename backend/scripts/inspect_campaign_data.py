import sys
import os
import asyncio
from sqlalchemy import select

# Add logical path components
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def main():
    async with async_session_factory() as session:
        stmt = select(Campaign).where(Campaign.name.like("%Retention Jan 2026%"))
        result = await session.execute(stmt)
        campaigns = result.scalars().all()

        if campaigns:
            print(f"--- FOND {len(campaigns)} CAMPAIGNS ---")
            for campaign in campaigns:
                print(f"\nID: {campaign.id}")
                print(f"Name: {campaign.name}")
                print(f"Status: {campaign.status}")
                print(f"Cohort Config ({type(campaign.cohort_config)}): {campaign.cohort_config}")
                print(f"Total Call Target: {campaign.total_call_target}")
                print(f"Call Duration: {campaign.call_duration}")
                print(f"Selected Cohorts: {campaign.selected_cohorts}")
                print(f"Execution Windows: {campaign.execution_windows}")
                print(f"Created At: {campaign.created_at}")
                print(f"Updated At: {campaign.updated_at}")
        else:
            print("Campaign 'Retention Jan 2026' NOT FOUND.")

            # List all campaigns to help debugging
            stmt_all = select(Campaign)
            res_all = await session.execute(stmt_all)
            all_campaigns = res_all.scalars().all()
            print(f"\nTotal Campaigns in DB: {len(all_campaigns)}")
            for c in all_campaigns:
                print(f"- {c.name}")

if __name__ == "__main__":
    asyncio.run(main())
