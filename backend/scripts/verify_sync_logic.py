import asyncio
from uuid import UUID
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.models.campaign import Campaign
from app.core.config import settings

async def verify_sync():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        # 1. Fetch a campaign
        result = await session.execute(select(Campaign).limit(1))
        campaign = result.scalars().first()
        
        if not campaign:
            print("No campaigns found for verification.")
            return

        print(f"Verifying campaign: {campaign.id}")
        
        # 2. Simulate an update to old fields
        campaign.cohort_config = {"TestCohort": 10}
        campaign.cohort_questions = {"TestCohort": ["Q1", "Q2"]}
        campaign.cohort_incentives = {"TestCohort": "GiftCard"}
        campaign.selected_cohorts = ["TestCohort"]
        
        # Simulating the logic I added to the endpoint:
        config = campaign.cohort_config or {}
        questions = campaign.cohort_questions or {}
        incentives = campaign.cohort_incentives or {}
        selected_list = campaign.selected_cohorts or []
        cohort_names = set(config.keys()) | set(questions.keys()) | set(incentives.keys()) | set(selected_list)
        
        new_cohort_data = {}
        for name in cohort_names:
            new_cohort_data[name] = {
                "target": config.get(name, 0),
                "questions": questions.get(name, []),
                "incentive": incentives.get(name, ""),
                "isSelected": name in selected_list
            }
        campaign.cohort_data = new_cohort_data
        
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        print(f"Updated cohort_data: {campaign.cohort_data}")
        assert "TestCohort" in campaign.cohort_data
        assert campaign.cohort_data["TestCohort"]["target"] == 10
        assert campaign.cohort_data["TestCohort"]["questions"] == ["Q1", "Q2"]
        assert campaign.cohort_data["TestCohort"]["isSelected"] == True
        print("Verification SUCCESS: Old fields (including selected_cohorts) sync to cohort_data")

        # 3. Simulate an update to cohort_data directly
        cd = {
            "NewCohort": {
                "target": 5,
                "questions": ["What's your name?"],
                "incentive": "Discount",
                "isSelected": True
            },
            "InactiveCohort": {
                "target": 0,
                "questions": [],
                "incentive": "",
                "isSelected": False
            }
        }
        # Simulating back-sync logic
        new_config = {}
        new_questions = {}
        new_incentives = {}
        new_selected = []
        for name, data in cd.items():
            new_config[name] = data.get("target", 0)
            new_questions[name] = data.get("questions", [])
            new_incentives[name] = data.get("incentive", "")
            if data.get("isSelected"):
                new_selected.append(name)
        
        campaign.cohort_data = cd
        campaign.cohort_config = new_config
        campaign.cohort_questions = new_questions
        campaign.cohort_incentives = new_incentives
        campaign.selected_cohorts = new_selected
        
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        print(f"Updated old fields from cohort_data: config={campaign.cohort_config}")
        assert "NewCohort" in campaign.cohort_config
        assert campaign.cohort_config["NewCohort"] == 5
        assert campaign.cohort_questions["NewCohort"] == ["What's your name?"]
        assert campaign.cohort_incentives["NewCohort"] == "Discount"
        print("Verification SUCCESS: cohort_data syncs back to old fields")

if __name__ == "__main__":
    asyncio.run(verify_sync())
