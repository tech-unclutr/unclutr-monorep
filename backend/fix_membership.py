import asyncio
import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())

from app.core.db import get_session

async def check_membership():
    """Check if CompanyMembership exists for the user"""
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2"
        company_id = "44f28dfd-7143-4ed1-bc23-d4b8a5d2831d"
        
        # Check if company_membership table exists
        result = await session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'company_membership'
            )
        """))
        table_exists = result.scalar()
        print(f"company_membership table exists: {table_exists}")
        
        if table_exists:
            # Check for membership
            result = await session.execute(text(f"""
                SELECT * FROM company_membership WHERE user_id = '{user_id}'
            """))
            membership = result.first()
            if membership:
                print(f"✅ Membership found: {membership}")
            else:
                print(f"❌ NO MEMBERSHIP FOUND for user {user_id}")
                print(f"   Need to create membership record!")
                
                # Create membership
                print(f"\n🔧 Creating membership...")
                await session.execute(text(f"""
                    INSERT INTO company_membership (user_id, company_id, role)
                    VALUES ('{user_id}', '{company_id}', 'OWNER')
                """))
                await session.commit()
                print("✅ Membership created!")
        else:
            print("❌ company_membership table does NOT exist!")
            print("   This table was skipped during restoration.")
            print("   Need to create it and seed membership data.")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await session.close()
        try:
            await session_gen.aclose()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(check_membership())
