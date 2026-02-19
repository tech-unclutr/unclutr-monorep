
import asyncio
import os
import sys
import uuid
from datetime import datetime
from sqlmodel import select
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine
from app.models.user import User
from app.models.company import Company
from app.models.iam import CompanyMembership, SystemRole

async def seed_data():
    print("🌱 Seeding Local DB...")
    
    # Data from Remote DB
    user_id = 'QrOwZmlu4ycKYdaUMz09rh0CoCc2'
    email = 'tech.unclutr@gmail.com'
    company_id = uuid.UUID('d47da809-b1aa-49c3-ace7-624aeddad9bd')
    brand_name = 'Mumbai Pav Company'
    legal_name = 'Tidal Food Ventures Private Limited'
    
    async with engine.begin() as conn: # Transaction
        # 1. Insert User
        print(f"👤 Inserting User {email}...")
        # Check if exists (should be empty but just in case)
        exists = await conn.execute(text(f"SELECT 1 FROM \"user\" WHERE id = '{user_id}'"))
        if not exists.scalar():
            await conn.execute(text(
                f"""
                INSERT INTO "user" (id, email, full_name, current_company_id, created_at, last_login_at, is_active, is_superuser, onboarding_completed)
                VALUES ('{user_id}', '{email}', 'Param', '{company_id}', now(), now(), true, false, true)
                """
            ))
            print("✅ User Inserted")
        else:
            print("⚠️  User already exists")

        # 2. Insert Company
        print(f"🏢 Inserting Company {brand_name}...")
        c_exists = await conn.execute(text(f"SELECT 1 FROM company WHERE id = '{company_id}'"))
        if not c_exists.scalar():
            # Minimal company fields
            await conn.execute(text(
                f"""
                INSERT INTO company (id, brand_name, legal_name, created_by, created_at, currency, timezone)
                VALUES ('{company_id}', '{brand_name}', '{legal_name}', '{user_id}', now(), 'INR', 'UTC')
                """
            ))
            print("✅ Company Inserted")
        else:
            print("⚠️  Company already exists")

        # 3. Insert Membership
        print(f"🤝 Inserting Membership...")
        m_exists = await conn.execute(text(f"SELECT 1 FROM company_membership WHERE user_id = '{user_id}' AND company_id = '{company_id}'"))
        if not m_exists.scalar():
            # ID needs a new UUID
            m_id = uuid.uuid4()
            await conn.execute(text(
                f"""
                INSERT INTO company_membership (id, user_id, company_id, role, created_at)
                VALUES ('{m_id}', '{user_id}', '{company_id}', 'OWNER', now())
                """
            ))
            print("✅ Membership Inserted")
        else:
            print("⚠️  Membership already exists")

    print("🎉 Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed_data())
