import asyncio
import sys
import os
from sqlalchemy.future import select
from uuid import UUID

# Add app to path
sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.campaign import Campaign

async def verify_campaign():
    target_id = "7b277bac-9157-4c01-9b6e-3b28b088e0b4"
    print(f"Checking for campaign {target_id}...")
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        # Check by strict UUID
        stmt = select(Campaign).where(Campaign.id == UUID(target_id))
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if campaign:
            print(f"FOUND: Campaign {campaign.id}")
            print(f"Name: {campaign.name}")
            print(f"Status: {campaign.status}")
            print(f"Company ID: {campaign.company_id}")
            print(f"User ID: {campaign.user_id}")
        else:
            print(f"NOT FOUND: Campaign {target_id}")
            
            # List all
            print("\nListing top 5 campaigns:")
            stmt_all = select(Campaign).limit(5)
            res_all = await session.execute(stmt_all)
            all_camps = res_all.scalars().all()
            for c in all_camps:
                print(f"- {c.id} ({c.name}) Status: {c.status}")
                
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        await session.close()
        try:
            await session_gen.aclose()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(verify_campaign())
