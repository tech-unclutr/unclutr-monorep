import asyncio
from uuid import UUID
from sqlalchemy import select
from app.core.db import engine
from app.models.campaign import Campaign

async def check_campaign(campaign_id_str):
    async with engine.connect() as conn:
        try:
            cid = UUID(campaign_id_str)
            stmt = select(Campaign).where(Campaign.id == cid)
            result = await conn.execute(stmt)
            c = result.first()
            if c:
                print(f"ID: {c.id}")
                print(f"Name: {c.name}")
                print(f"Status: {c.status}")
                print(f"Brand Context: {c.brand_context}")
                print(f"Customer Context: {c.customer_context}")
                print(f"Team Context: {c.team_member_context}")
                print(f"Execution Windows: {c.execution_windows}")
            else:
                print("Campaign not found")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        asyncio.run(check_campaign(sys.argv[1]))
    else:
        print("Please provide a campaign ID")
