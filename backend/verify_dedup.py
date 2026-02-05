
import asyncio
import httpx
from uuid import UUID
from app.core.config import settings
from app.core.db import async_session_factory
from app.models.company import Company
from app.models.user import User # Ensure User is imported
from sqlalchemy import select

# Configuration
BASE_URL = "http://localhost:8000"

async def run_verification():
    async with async_session_factory() as session:
        from app.models.iam import CompanyMembership
        
        # 1. Get a valid Company for the dev user
        stmt = (
            select(Company)
            .join(CompanyMembership, CompanyMembership.company_id == Company.id)
            .where(CompanyMembership.user_id == "dev-user-123")
            .limit(1)
        )
        result = await session.execute(stmt)
        company = result.scalars().first()
        
        if not company:
            print("Dev user has no company memberships.")
            return

        company_id = str(company.id)
        print(f"Using Company ID: {company_id}")

        # 2. Prepare Payload with Duplicates
        # We use a random phone number to avoid conflicting with existing constraints if we run multiple times
        import random
        rand_suffix = random.randint(1000, 9999)
        duplicate_phone = f"+1555010{rand_suffix}"
        
        payload = {
            "campaign_name": f"Deduplication Verify {rand_suffix}",
            "leads": [
                {
                    "customer_name": "Alice First",
                    "contact_number": duplicate_phone,
                    "cohort": "Cohort A",
                    "meta_data": {"source": "first_entry"}
                },
                {
                    "customer_name": "Alice Second",
                    "contact_number": duplicate_phone,
                    "cohort": "Cohort B", # Should overwrite to Cohort B
                    "meta_data": {"source": "second_entry"}
                },
                {
                    "customer_name": "Bob Unique",
                    "contact_number": f"+1555020{rand_suffix}",
                    "cohort": "Cohort C",
                    "meta_data": {}
                }
            ],
            "force_create": True 
        }

        # 3. Call API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.SWAGGER_DEV_TOKEN}",
            "X-Company-ID": company_id
        }

        print("Sending request to create-from-csv...")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/intelligence/campaigns/create-from-csv",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            print(f"Response Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("Success Response:", data)
                
                # Verification Logic
                # Expected: leads_count should be 2, original_count 3
                if data.get("leads_count") == 2 and data.get("original_count") == 3:
                     print("✅ VERIFICATION PASSED: Duplicates were merged.")
                else:
                     print("❌ VERIFICATION FAILED: Counts do not match expected values.")
            else:
                print("❌ API Error:", response.text)

if __name__ == "__main__":
    asyncio.run(run_verification())
