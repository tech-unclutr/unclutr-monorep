import asyncio
from uuid import UUID
from typing import Dict, Any, List
from sqlmodel import Session, select, create_engine
from app.models.campaign import Campaign
from app.core.config import settings

# Since we are using asyncpg in the app, but sqlmodel/sqlalchemy for scripts often uses synchronous engine for simplicity if not complex
# However, the settings.DATABASE_URL is set for asyncpg.
# Let's use a synchronous version for this one-off script if possible, or just use async.

import sqlalchemy
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

async def consolidate_cohort_data():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        result = await session.execute(select(Campaign))
        campaigns = result.scalars().all()
        
        print(f"Found {len(campaigns)} campaigns to process.")
        
        updated_count = 0
        for campaign in campaigns:
            # Consolidation logic
            # cohort_config: Dict[str, int] = {cohort_name: target_count}
            # cohort_questions: Dict[str, List[str]] = {cohort_name: [questions]}
            # cohort_incentives: Dict[str, str] = {cohort_name: incentive}
            
            config = campaign.cohort_config or {}
            questions = campaign.cohort_questions or {}
            incentives = campaign.cohort_incentives or {}
            
            # Use selected_cohorts as the master list if it exists, otherwise use keys from config
            cohort_names = set(config.keys()) | set(questions.keys()) | set(incentives.keys())
            if campaign.selected_cohorts:
                cohort_names = cohort_names | set(campaign.selected_cohorts)
            
            selected_list = campaign.selected_cohorts or []
            new_cohort_data = {}
            for name in cohort_names:
                new_cohort_data[name] = {
                    "target": config.get(name, 0),
                    "questions": questions.get(name, []),
                    "incentive": incentives.get(name, ""),
                    "isSelected": name in selected_list
                }
            
            if new_cohort_data:
                campaign.cohort_data = new_cohort_data
                session.add(campaign)
                updated_count += 1
        
        if updated_count > 0:
            await session.commit()
            print(f"Successfully consolidated cohort data for {updated_count} campaigns.")
        else:
            print("No cohort data found to consolidate.")

if __name__ == "__main__":
    asyncio.run(consolidate_cohort_data())
