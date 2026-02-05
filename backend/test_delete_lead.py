"""
Test script to check the delete lead endpoint with proper authentication
"""
import asyncio
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.db import get_session
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.campaign_event import CampaignEvent

async def test_delete():
    lead_id = UUID("0b3f4fa2-4132-4c95-8e90-b4794de4a3e1")
    
    async for session in get_session():
        try:
            # Check if lead exists
            stmt = select(CampaignLead).where(CampaignLead.id == lead_id)
            result = await session.execute(stmt)
            lead = result.scalars().first()
            
            if not lead:
                print(f"Lead {lead_id} not found")
                return
            
            print(f"Found lead: {lead.customer_name} - {lead.contact_number}")
            print(f"Campaign ID: {lead.campaign_id}")
            print(f"Status: {lead.status}")
            
            # Try to delete
            print("\nAttempting delete...")
            
            # 1. Delete queue items
            queue_delete_stmt = delete(QueueItem).where(QueueItem.lead_id == lead_id)
            result1 = await session.execute(queue_delete_stmt)
            print(f"Deleted {result1.rowcount} queue items")
            
            # 2. Delete campaign events
            event_delete_stmt = delete(CampaignEvent).where(CampaignEvent.lead_id == lead_id)
            result2 = await session.execute(event_delete_stmt)
            print(f"Deleted {result2.rowcount} campaign events")
            
            # 3. Delete lead
            lead_delete_stmt = delete(CampaignLead).where(CampaignLead.id == lead_id)
            result3 = await session.execute(lead_delete_stmt)
            print(f"Deleted {result3.rowcount} leads")
            
            await session.commit()
            print("\n✓ Delete successful!")
            
        except Exception as e:
            print(f"\n✗ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(test_delete())
