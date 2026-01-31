import asyncio
from app.core.db import get_session
from app.models.company import Company, Brand
from app.models.campaign import Campaign
from app.services.intelligence.campaign_service import campaign_service
from uuid import UUID, uuid4

async def main():
    # Mumbai Pav Co ID
    company_id = UUID("28233392-a23b-4f2d-b051-fb9d8cc7c97b")
    user_id = "dev-user-123"
    
    async for session in get_session():
        # Clean up any existing campaign from previous failed run
        # Not needed since we delete
        
        # Create a campaign
        print(f"Creating test campaign for {company_id}...")
        campaign = Campaign(
            company_id=company_id,
            user_id=user_id,
            name="Test Campaign V2 Auto-Write",
            status="DRAFT",
            phone_number=""
        )
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        print(f"Created campaign {campaign.id}")
        
        # Ensure brands are linked (for context gathering logic)
        # Not needed if they already exist
        
        print("Testing get_context_suggestions...")
        try:
            # We expect either a successful LLM gen (relatable) OR a smart fallback
            suggestions = await campaign_service.get_context_suggestions(session, campaign.id, user_id)
            print("SUGGESTIONS RESULT:")
            print("-" * 40)
            print(suggestions['brand_context'])
            print("-" * 40)
            print(f"Team Context: '{suggestions['team_member_context']}'")
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()
            
        # Cleanup
        await session.delete(campaign)
        await session.commit()
        print("Test campaign deleted.")
        break

if __name__ == "__main__":
    asyncio.run(main())
