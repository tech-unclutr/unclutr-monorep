import asyncio
import sys
import os
import json
from uuid import UUID

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.services.intelligence.campaign_service import campaign_service
from app.core.config import settings

async def main():
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    company_id = UUID("017ac5e1-78fc-438f-813f-ffc9acc18c14")
    user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2" 
    
    async with async_session_factory() as session:
        print(f"--- Starting Simulation for Company {company_id} ---")
        try:
            campaign = await campaign_service.simulate_intake_call(session, company_id, user_id)
            print("\n[SUCCESS] Campaign Created!")
            print(f"ID: {campaign.id}")
            print(f"Name: {campaign.name}")
            print(f"Quality Score: {campaign.quality_score}/5")
            print(f"Gap Analysis: {campaign.quality_gap}")
            print("\n[Decision Context]")
            print(json.dumps(campaign.decision_context, indent=2))
        except Exception as e:
            print(f"\n[ERROR] Simulation Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
