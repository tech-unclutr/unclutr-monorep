
import asyncio
import os
import sys
from sqlmodel import select
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine

async def debug_membership():
    print("🔍 Debugging Company Membership...")
    
    user_id = 'QrOwZmlu4ycKYdaUMz09rh0CoCc2'
    target_company_id = 'd47da809-b1aa-49c3-ace7-624aeddad9bd'
    
    async with engine.connect() as conn:
        print(f"\n👥 Checking Memberships for User ID: {user_id}")
        result = await conn.execute(text(
            f"SELECT user_id, company_id, role FROM company_membership WHERE user_id = '{user_id}'"
        ))
        
        found_target = False
        rows = result.fetchall()
        
        if not rows:
            print("❌ No memberships found for this user!")
        
        for row in rows:
            print(f" - Company: {row.company_id} | Role: {row.role}")
            if str(row.company_id) == target_company_id:
                found_target = True
                
        if not found_target:
            print(f"\n⚠️  MISSING MEMBERSHIP for target company {target_company_id}")
            print("🛠  Attempting to fix...")
            try:
                await conn.execute(text(
                    f"INSERT INTO company_membership (user_id, company_id, role, created_at, updated_at) VALUES ('{user_id}', '{target_company_id}', 'admin', now(), now())"
                ))
                await conn.commit()
                print("✅ INSERT SUCCESSFUL!")
            except Exception as e:
                print(f"❌ INSERT FAILED: {e}")
        else:
            print("\n✅ Target membership exists.")

if __name__ == "__main__":
    asyncio.run(debug_membership())
