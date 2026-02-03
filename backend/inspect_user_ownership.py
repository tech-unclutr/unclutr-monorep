import asyncio
import sys
import os
from sqlalchemy.future import select

# Add app to path
sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.user import User
from app.models.campaign import Campaign

async def inspect_user_and_campaign():
    target_email = "tech.unclutr@gmail.com"
    target_campaign_id = "7b277bac-9157-4c01-9b6e-3b28b088e0b4"
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        # 1. Fetch User
        print(f"--- Looking up User: {target_email} ---")
        stmt = select(User).where(User.email == target_email)
        result = await session.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            print("❌ User NOT FOUND")
            return
            
        print(f"✅ User Found:")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Company ID: {user.current_company_id}")
        
        # 2. Fetch Campaign
        print(f"\n--- Looking up Campaign: {target_campaign_id} ---")
        campaign = await session.get(Campaign, target_campaign_id)
        
        if not campaign:
            print("❌ Campaign NOT FOUND")
        else:
            print(f"✅ Campaign Found:")
            print(f"   ID: {campaign.id}")
            print(f"   Name: {campaign.name}")
            print(f"   Status: {campaign.status}")
            print(f"   Company ID: {campaign.company_id}")
            print(f"   Current Owner User ID: {campaign.user_id}")
            
            # 3. Compare
            if str(campaign.user_id) != str(user.id):
                print(f"\n⚠️  MISMATCH DETECTED!")
                print(f"   Campaign Owner: {campaign.user_id}")
                print(f"   Logged in User: {user.id}")
                print("   Action Recommended: Update campaign user_id to match")
            else:
                print("\n✅ User ID matches Campaign Owner")

            if str(campaign.company_id) != str(user.current_company_id):
                 print(f"\n⚠️  COMPANY MISMATCH DETECTED!")
                 print(f"   Campaign Company: {campaign.company_id}")
                 print(f"   User Company: {user.current_company_id}")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        await session.close()
        try:
            await session_gen.aclose()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(inspect_user_and_campaign())
