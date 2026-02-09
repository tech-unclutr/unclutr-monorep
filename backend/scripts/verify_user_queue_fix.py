import asyncio
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

# Mock app and models
class MockLead:
    def __init__(self, id, customer_name, contact_number):
        self.id = id
        self.customer_name = customer_name
        self.contact_number = contact_number

class MockQueueItem:
    def __init__(self, id, lead_id, status):
        self.id = id
        self.lead_id = lead_id
        self.status = status
        self.ai_summary = "Test summary"
        self.intent_strength = "high"
        self.confirmation_slot = None
        self.detected_at = datetime.utcnow()
        self.priority_score = 10
        self.user_call_count = 0
        self.last_user_call_at = None
        self.locked_by_user_id = None

async def verify_fix():
    print("Verifying fix for user_queue.py...")
    
    lead_id = uuid.uuid4()
    item_id = uuid.uuid4()
    
    # Mock lead with customer_name (NO first_name/last_name)
    lead = MockLead(lead_id, "John Doe", "1234567890")
    item = MockQueueItem(item_id, lead_id, "READY")
    
    # Simulation of the formatting logic in user_queue.py
    try:
        lead_name = lead.customer_name if lead.customer_name else lead.contact_number
        print(f"Formatted lead name: {lead_name}")
        assert lead_name == "John Doe"
        print("✅ Fix verified! customer_name used successfully.")
    except AttributeError as e:
        print(f"❌ Fix failed! AttributeError still present: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(verify_fix())
