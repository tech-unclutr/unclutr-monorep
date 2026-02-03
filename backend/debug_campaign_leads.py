import asyncio
from uuid import UUID
from sqlmodel import select, func, or_
from app.api.deps import get_session
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.db.session import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

CAMPAIGN_ID = UUID("7b277bac-9157-4c01-9b6e-3b28b088e0b4")

async def analyze_campaign():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # 1. Get Campaign Config
        campaign = await session.get(Campaign, CAMPAIGN_ID)
        print(f"\n=== Campaign: {campaign.name} ===")
        print(f"Status: {campaign.status}")
        print(f"Selected Cohorts: {campaign.selected_cohorts}")
        print(f"Config: {campaign.execution_config}")
        
        # 2. Total Leads by Cohort (All)
        print(f"\n=== Total Leads by Cohort ===")
        stmt = select(CampaignLead.cohort, func.count()).where(CampaignLead.campaign_id == CAMPAIGN_ID).group_by(CampaignLead.cohort)
        results = await session.execute(stmt)
        total_leads = 0
        for cohort, count in results:
            print(f"- {cohort}: {count}")
            total_leads += count
        print(f"Total Leads: {total_leads}")

        # 3. Queue Items Status
        print(f"\n=== Queue Items Status ===")
        stmt = select(QueueItem.status, func.count()).where(QueueItem.campaign_id == CAMPAIGN_ID).group_by(QueueItem.status)
        results = await session.execute(stmt)
        for status, count in results:
            print(f"- {status}: {count}")

        # 4. Leads NOT in Queue (Backlog Potential)
        print(f"\n=== Backlog Analysis ===")
        existing_q = select(QueueItem.lead_id).where(QueueItem.campaign_id == CAMPAIGN_ID)
        
        backlog_query = select(CampaignLead).where(CampaignLead.campaign_id == CAMPAIGN_ID).where(CampaignLead.id.not_in(existing_q))
        
        if campaign.selected_cohorts:
             backlog_query = backlog_query.where(CampaignLead.cohort.in_(campaign.selected_cohorts))
        
        backlog_results = await session.execute(backlog_query)
        backlog_leads = backlog_results.all()
        print(f"Leads available for Backlog (matching selected cohorts): {len(backlog_leads)}")
        for l in backlog_leads[:5]:
            print(f"  - {l.customer_name} ({l.cohort})")

if __name__ == "__main__":
    asyncio.run(analyze_campaign())
