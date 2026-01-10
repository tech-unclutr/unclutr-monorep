import asyncio
import uuid
from sqlmodel import select, and_
from app.core.db import init_db, get_session
from app.models.company import Company
from app.models.datasource import DataSource
from app.services import integration_service
from sqlalchemy.orm import selectinload

async def verify_crud():
    await init_db()
    async for session in get_session():
        # 1. Setup - Find a test company and a datasource
        stmt = select(Company).limit(1)
        company = (await session.exec(stmt)).first()
        if not company:
            print("No company found for test.")
            return

        stmt = select(DataSource).where(DataSource.slug == "shopify")
        ds = (await session.exec(stmt)).first()
        if not ds:
            print("Shopify datasource not found.")
            return

        print(f"Testing with Company: {company.id}, DataSource: {ds.slug}")

        # 2. Test ADD
        print("\n--- Testing Add to Stack ---")
        category = "Storefront"
        result = await integration_service.add_manual_datasource(session, company.id, ds.slug, category)
        print(f"Add Result: {result}")

        # Refresh and Check Structure
        await session.refresh(company)
        print(f"Post-Add stack_data: {company.stack_data}")
        
        if "stack" in company.stack_data and ds.slug in company.stack_data["stack"].get(category, []):
            print("✅ SUCCESS: Add to Stack preserved nested structure.")
        else:
            print("❌ FAILURE: Add to Stack structure mismatch.")

        # 3. Test DISCONNECT (Removal from stack)
        print("\n--- Testing Disconnect / Remove from Stack ---")
        # Find the integration record
        from app.models.integration import Integration
        stmt = select(Integration).where(and_(Integration.company_id == company.id, Integration.datasource_id == ds.id))
        integration = (await session.exec(stmt)).first()
        
        if not integration:
            print("Integration record not found after add.")
        else:
            # Set to inactive first if needed to trigger removal in next call, 
            # but disconnect_integration logic handles removal if it was already inactive or not active.
            # Let's just call it.
            await integration_service.disconnect_integration(session, company.id, integration.id)
            
            await session.refresh(company)
            print(f"Post-Disconnect stack_data: {company.stack_data}")
            
            stack = company.stack_data.get("stack", {})
            if ds.slug not in stack.get(category, []):
                print("✅ SUCCESS: Disconnect removed item from nested structure.")
            else:
                print("❌ FAILURE: Disconnect did not remove item.")

        break

if __name__ == "__main__":
    asyncio.run(verify_crud())
