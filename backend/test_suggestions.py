import asyncio
from app.core.db import get_session
from app.services.intelligence.campaign_service import campaign_service
from uuid import UUID

async def main():
    campaign_id = UUID("496413af-33d5-4a15-8f2d-0cbd4780651f")
    user_id = "dev-user-123"
    
    async for session in get_session():
        print(f"Testing get_context_suggestions for campaign {campaign_id}...")
        try:
            suggestions = await campaign_service.get_context_suggestions(session, campaign_id, user_id)
            print("SUGGESTIONS RESULT:")
            print(suggestions)
        except Exception as e:
            print(f"ERROR: {e}")
        break

if __name__ == "__main__":
    asyncio.run(main())
