
import asyncio
from sqlalchemy import select, func, delete, text
from app.core.db import async_session_factory
from app.models.campaign_lead import CampaignLead

async def cleanup_duplicates():
    async with async_session_factory() as session:
        print("Finding duplicates...")
        
        # Find duplicates grouping by campaign_id and contact_number
        stmt = (
            select(
                CampaignLead.campaign_id,
                CampaignLead.contact_number,
                func.count(CampaignLead.id).label("count")
            )
            .group_by(CampaignLead.campaign_id, CampaignLead.contact_number)
            .having(func.count(CampaignLead.id) > 1)
        )
        
        result = await session.execute(stmt)
        duplicates = result.all()
        
        print(f"Found {len(duplicates)} groups of duplicates.")
        
        deleted_count = 0
        
        for campaign_id, contact_number, count in duplicates:
            print(f"Processing duplicate: Campaign={campaign_id}, Phone={contact_number}, Count={count}")
            
            # Fetch all entries for this duplicate group
            entries_stmt = select(CampaignLead).where(
                CampaignLead.campaign_id == campaign_id,
                CampaignLead.contact_number == contact_number
            ).order_by(CampaignLead.created_at.desc()) # Keep latest? Or check status?
            
            entries_result = await session.execute(entries_stmt)
            entries = entries_result.scalars().all()
            
            # Keep the first one (latest created), delete the rest
            keep_id = entries[0].id
            delete_ids = [e.id for e in entries[1:]]
            
            if delete_ids:
                print(f"Keeping {keep_id}, deleting {len(delete_ids)} others.")
                delete_stmt = delete(CampaignLead).where(CampaignLead.id.in_(delete_ids))
                await session.execute(delete_stmt)
                deleted_count += len(delete_ids)
                
        await session.commit()
        print(f"Cleanup complete. Deleted {deleted_count} duplicate leads.")

if __name__ == "__main__":
    asyncio.run(cleanup_duplicates())
