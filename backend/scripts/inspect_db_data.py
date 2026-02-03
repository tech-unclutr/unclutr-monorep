
import asyncio
import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session
from app.models.user import User
from app.models.company import Company
from app.models.integration import Integration
from app.models.campaign import Campaign
from sqlmodel import select

async def inspect():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("--- USERS ---")
    result = await session.execute(select(User))
    users = result.scalars().all()
    for u in users:
        print(f"ID: {u.id} | Email: {u.email} | Name: {u.full_name} | Created: {u.created_at}")
    
    print("\n--- COMPANIES ---")
    result = await session.execute(select(Company))
    companies = result.scalars().all()
    for c in companies:
        print(f"ID: {c.id} | Brand Name: {c.brand_name} | Created: {c.created_at}")

    print("\n--- BRANDS ---")
    from app.models.company import Brand
    result = await session.execute(select(Brand))
    brands = result.scalars().all()
    for b in brands:
        print(f"ID: {b.id} | Name: {b.name} | Created: {b.created_at}")

    print("\n--- WORKSPACES ---")
    from app.models.company import Workspace
    result = await session.execute(select(Workspace))
    workspaces = result.scalars().all()
    for w in workspaces:
        print(f"ID: {w.id} | Name: {w.name} | Created: {w.created_at}")

    print("\n--- CAMPAIGNS ---")
    result = await session.execute(select(Campaign))
    campaigns = result.scalars().all()
    for camp in campaigns:
        print(f"ID: {camp.id} | Name: {camp.name} | User: {camp.user_id} | Co: {camp.company_id} | Created: {camp.created_at}")

    print("\n--- INTEGRATIONS ---")
    result = await session.execute(select(Integration))
    integrations = result.scalars().all()
    for i in integrations:
        print(f"ID: {i.id} | DS: {i.datasource_id} | Co: {i.company_id} | Created: {i.created_at}")

    print("\n--- SHOPIFY TABLES ---")
    result = await session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'shopify_%'"))
    shopify_tables = [row[0] for row in result.all()]
    for table in shopify_tables:
        count_res = await session.execute(text(f"SELECT count(*) FROM {table}"))
        count = count_res.scalar()
        print(f"Table: {table} | Count: {count}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(inspect())
