
import asyncio
import os
import sys
from sqlmodel import select
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine

async def debug_data():
    print("🔍 Debugging Company Data...")
    
    async with engine.connect() as conn:
        # 1. Get User
        print("\n👤 Checking User 'tech.unclutr@gmail.com'...")
        result = await conn.execute(text(
            "SELECT id, email, current_company_id FROM \"user\" WHERE email = 'tech.unclutr@gmail.com'"
        ))
        user = result.fetchone()
        
        if user:
            print(f"✅ User Found: ID={user.id}, Email={user.email}")
            print(f"👉 Current Company ID: {user.current_company_id}")
            
            if user.current_company_id:
                # 2. Check that company
                print(f"\n🏢 Checking Company {user.current_company_id}...")
                company_result = await conn.execute(text(
                    f"SELECT id, brand_name, legal_name FROM company WHERE id = '{user.current_company_id}'"
                ))
                company = company_result.fetchone()
                
                if company:
                    print(f"✅ Company Found: Name={company.brand_name}, Legal={company.legal_name}")
                else:
                    print(f"❌ Company NOT FOUND in DB!")
            else:
                print("⚠️  User has NO current_company_id set.")
        else:
            print("❌ User 'tech.unclutr@gmail.com' NOT FOUND.")
            
        # 3. List all companies
        print("\n📋 All Companies:")
        all_companies = await conn.execute(text("SELECT id, brand_name, created_by FROM company"))
        for c in all_companies.fetchall():
            print(f" - {c.id}: {c.brand_name} (Created by: {c.created_by})")

if __name__ == "__main__":
    asyncio.run(debug_data())
