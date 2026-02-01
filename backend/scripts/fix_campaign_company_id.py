import sys
import os
import asyncio
from sqlalchemy import select, delete

# Add logical path components
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def main():
    async with async_session_factory() as session:
        # Configuration
        valid_campaign_id = "dd96b62f-9ac6-4c2e-a061-d1a407644ee3" # The one with data
        target_company_id = "b3aa85f9-dca7-44ee-8668-686665cfc117" # The user's actual company
        empty_draft_id = "880fda74-3870-4fa8-8499-71829067db4f" # The one blocking/duplicating

        print(f"Step 1: Removing empty draft {empty_draft_id}...")
        stmt_del = delete(Campaign).where(Campaign.id == empty_draft_id)
        await session.execute(stmt_del)
        
        print(f"Step 2: Migrating valid campaign {valid_campaign_id} to company {target_company_id}...")
        stmt_get = select(Campaign).where(Campaign.id == valid_campaign_id)
        res = await session.execute(stmt_get)
        campaign = res.scalar_one_or_none()
        
        if campaign:
            old_company = campaign.company_id
            campaign.company_id = target_company_id
            session.add(campaign)
            await session.commit()
            print(f"Success! Migrated campaign from {old_company} to {target_company_id}")
        else:
            print("Error: Valid campaign not found!")

if __name__ == "__main__":
    asyncio.run(main())
