import asyncio
import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.campaign import Campaign
from sqlalchemy import select

async def main():
    print("Querying campaigns...")
    async for session in get_session():
        try:
            stmt = select(Campaign)
            result = await session.execute(stmt)
            campaigns = result.scalars().all()
            
            print(f"Found {len(campaigns)} campaigns.")
            for c in campaigns:
                print(f"ID: {c.id}")
                print(f"  Name: {c.name}")
                print(f"  Status: {c.status}")
                print(f"  Quality Score: {c.quality_score}")
                
                # Check extracted data for any score hint
                extracted = c.bolna_extracted_data or {}
                custom = extracted.get('custom_extractions', {})
                print(f"  Extracted Data 'goal_clarity_score': {custom.get('goal_clarity_score')}")
                print("-" * 30)
                
        except Exception as e:
            print(f"Error: {e}")
        finally:
            # wrapper handles close? get_session yields session
            # we just break to only use one session
            break

if __name__ == "__main__":
    asyncio.run(main())
