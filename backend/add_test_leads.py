import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from sqlmodel import select
from datetime import datetime

async def add_test_leads():
    async with async_session_factory() as session:
        campaign_id = UUID('ff4d88d2-9c17-4da6-90a5-c8eceb976566')
        
        test_leads = [
            {"name": "Low Priority", "score": 100, "number": "+1111111111"},
            {"name": "Mid Priority", "score": 500, "number": "+2222222222"},
            {"name": "High Priority", "score": 1000, "number": "+3333333333"}
        ]
        
        for data in test_leads:
            lead = CampaignLead(
                campaign_id=campaign_id,
                customer_name=data["name"],
                contact_number=data["number"],
                cohort="Testing"
            )
            session.add(lead)
            await session.flush()
            
            q_item = QueueItem(
                campaign_id=campaign_id,
                lead_id=lead.id,
                status="READY",
                priority_score=data["score"],
                execution_count=0
            )
            session.add(q_item)
            
        await session.commit()
        print("Test leads added and queued as READY.")

if __name__ == "__main__":
    asyncio.run(add_test_leads())
