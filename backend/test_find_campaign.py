import asyncio
from app.core.db import get_session
from app.models.campaign import Campaign
from sqlmodel import select

async def main():
    async for session in get_session():
        stmt = select(Campaign).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        if campaign:
            print(f"CAMPAIGN_ID={campaign.id}")
            print(f"COMPANY_ID={campaign.company_id}")
            print(f"USER_ID={campaign.user_id}")
        else:
            print("No campaign found")
        break

if __name__ == "__main__":
    asyncio.run(main())
