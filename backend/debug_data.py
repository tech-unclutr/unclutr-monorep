import asyncio
import sys
import os
import json

sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.campaign import Campaign
from sqlalchemy import select

async def main():
    async for session in get_session():
        stmt = select(Campaign).where(Campaign.status == 'COMPLETED')
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        
        for c in campaigns:
            print(f"ID: {c.id}")
            print(f"Name: {c.name}")
            data = c.bolna_extracted_data or {}
            print(f"Extracted Keys: {list(data.keys())}")
            print(f"Decision 1: {data.get('decision_1')}")
            print(f"Success Metric 1: {data.get('success_metric_1')}")
            print(f"Deadline: {data.get('decision_1_deadline')}")
            print(f"Cohorts: {data.get('target_cohorts')}")
            print(f"Evidence: {data.get('evidence_needed')}")
            print("-" * 30)
        break

if __name__ == "__main__":
    asyncio.run(main())
