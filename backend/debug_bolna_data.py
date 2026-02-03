import asyncio
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from sqlalchemy import select

async def run():
    async with async_session_factory() as s:
        stmt = select(Campaign).where(Campaign.execution_windows != None)
        c = (await s.execute(stmt)).scalars().first()
        if c:
            print(f"ID: {c.id}")
            print(f"Windows: {c.execution_windows}")
            print(f"Cohort Questions: {c.cohort_questions}")
            print(f"Cohort Incentives: {c.cohort_incentives}")
        else:
            print("No campaign with windows found")

if __name__ == "__main__":
    asyncio.run(run())
