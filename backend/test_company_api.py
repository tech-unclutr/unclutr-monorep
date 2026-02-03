import asyncio
import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())

from app.core.db import get_session

async def test_company_endpoint():
    """Test if company data exists for the user's company_id"""
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        # Get the user's company_id
        result = await session.execute(text("""
            SELECT current_company_id FROM "user" WHERE email = 'tech.unclutr@gmail.com'
        """))
        company_id = result.scalar()
        print(f"User's Company ID: {company_id}")
        
        if company_id:
            # Check if company exists
            result = await session.execute(text(f"""
                SELECT id, brand_name, created_at FROM company WHERE id = '{company_id}'
            """))
            company = result.first()
            if company:
                print(f"✅ Company Found: {company[1]} (ID: {company[0]})")
            else:
                print(f"❌ Company NOT FOUND for ID: {company_id}")
                print("This is why the settings page hangs!")
        else:
            print("❌ User has no current_company_id set!")
            
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        await session.close()
        try:
            await session_gen.aclose()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(test_company_endpoint())
