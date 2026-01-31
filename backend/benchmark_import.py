
import asyncio
import time
from datetime import datetime
from uuid import uuid4
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from sqlalchemy import insert

async def run_benchmark():
    leads_count = 500
    company_id = uuid4()
    user_id = str(uuid4())
    
    print(f"Starting CORE BULK INSERT benchmark for {leads_count} leads...")
    
    start_time = time.time()
    
    async with AsyncSession(engine) as session:
        # 1. Create Campaign
        campaign = Campaign(
            company_id=company_id,
            user_id=user_id,
            name="Benchmark Campaign Core",
            status="DRAFT"
        )
        session.add(campaign)
        await session.flush()
        
        # 2. Bulk Create Leads (Core)
        leads_data = [
            {
                "id": uuid4(),
                "campaign_id": campaign.id,
                "customer_name": f"Customer {i}",
                "contact_number": f"+1555000{i:04d}",
                "cohort": "Benchmark",
                "meta_data": {"row": i, "data": "test"},
                "status": "PENDING",
                "created_at": datetime.utcnow()
            }
            for i in range(leads_count)
        ]
            
        stmt = insert(CampaignLead).values(leads_data)
        await session.execute(stmt)
        await session.commit()
        
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Benchmark completed in {duration:.4f} seconds.")
    print(f"Rate: {leads_count / duration:.2f} leads/second")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
