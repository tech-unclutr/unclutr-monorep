import asyncio
import uuid
from sqlalchemy.orm.attributes import flag_modified
from sqlmodel import select
from app.core.db import get_session
from app.models.integration import Integration, IntegrationStatus
from app.models.datasource import DataSource
from app.models.company import Company
from app.services.integration_service import disconnect_integration, get_integrations_for_company
from loguru import logger

async def test_multi_store_disconnection():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # 1. Setup Mock State - Create a completely FRESH company
        company = Company(
            brand_name=f"Test Company {uuid.uuid4().hex[:8]}",
            legal_name="Test Legal Entity",
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)
        
        # Create a brand
        from app.models.company import Brand
        brand = Brand(
            company_id=company.id,
            name=company.brand_name
        )
        session.add(brand)
        await session.commit()
        await session.refresh(brand)
        
        # Create a workspace
        from app.models.company import Workspace
        workspace = Workspace(
            company_id=company.id,
            brand_id=brand.id,
            name="Primary Workspace"
        )
        session.add(workspace)
        await session.commit()
        await session.refresh(workspace)
        
        logger.info(f"Using FRESH company: {company.brand_name} ({company.id}), Brand: {brand.id}")
        logger.info(f"Using workspace: {workspace.id}")
        
        # Find Shopify DataSource
        stmt = select(DataSource).where(DataSource.name == "Shopify")
        shopify_ds = (await session.execute(stmt)).scalars().first()
        if not shopify_ds:
            logger.error("Shopify DataSource not found")
            return

        # 2. Add two Shopify IDs into stack
        id1 = str(uuid.uuid4())
        id2 = str(uuid.uuid4())
        
        company.stack_data = {
            "shopify": {
                "id": str(shopify_ds.id),
                "slug": "shopify",
                "label": "Shopify",
                "instances": [id1, id2]
            }
        }
        flag_modified(company, "stack_data")
        session.add(company)
        await session.commit()
        
        # 3. Create two ACTIVE integrations
        int1 = Integration(
            id=uuid.UUID(id1),
            company_id=company.id,
            workspace_id=workspace.id,
            datasource_id=shopify_ds.id,
            status=IntegrationStatus.ACTIVE,
            in_stack=True,
            metadata_info={"shop": "store-1.myshopify.com"}
        )
        int2 = Integration(
            id=uuid.UUID(id2),
            company_id=company.id,
            workspace_id=workspace.id,
            datasource_id=shopify_ds.id,
            status=IntegrationStatus.ACTIVE,
            in_stack=True,
            metadata_info={"shop": "store-2.myshopify.com"}
        )
        session.add(int1)
        session.add(int2)
        await session.commit()
        
        logger.info(f"Created two integrations for fresh company: {id1} and {id2}")
        
        # 4. Disconnect the first one (Active -> Inactive)
        logger.info(f"Disconnecting integration 1 ({id1})...")
        await disconnect_integration(session, company.id, id1)
        
        # Check status
        await session.refresh(int1)
        logger.info(f"Integration 1 status: {int1.status}")
        assert int1.status == IntegrationStatus.INACTIVE
        
        # Check stack_data - should STILL have shopify slug and BOTH IDs (State 0 keeps them in stack)
        await session.refresh(company)
        logger.info(f"Stack data after disconnect (active->inactive): {company.stack_data}")
        assert "shopify" in company.stack_data
        
        # 5. Remove the first one from stack (Inactive -> Deleted)
        logger.info(f"Removing integration 1 ({id1}) from stack...")
        await disconnect_integration(session, company.id, id1)
        
        # Check if int1 deleted
        stmt = select(Integration).where(Integration.id == uuid.UUID(id1))
        res = await session.execute(stmt)
        assert res.scalars().first() is None
        logger.info(f"Integration 1 deleted successfully")
        
        # Check stack_data - should STILL HAVE 'shopify' but only id2 in instances
        await session.refresh(company)
        logger.info(f"Stack data after removal: {company.stack_data}")
        assert "shopify" in company.stack_data
        instances = company.stack_data["shopify"].get("instances", [])
        assert id1 not in instances
        assert id2 in instances
        
        # 6. Remove the second one from stack (Active -> Inactive -> Deleted)
        logger.info(f"Disconnecting integration 2 ({id2}) [State 0]...")
        await disconnect_integration(session, company.id, id2) # State 0
        
        logger.info(f"Removing integration 2 ({id2}) from stack [Final Removal]...")
        await disconnect_integration(session, company.id, id2) # Removal
        
        # Check stack_data - should be EMPTY now as it was the LAST instance
        await session.refresh(company)
        logger.info(f"Stack data after last removal: {company.stack_data}")
        assert "shopify" not in company.stack_data
        
        logger.info("✅ Multi-store disconnection test PASSED")

    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        await session.close()

if __name__ == "__main__":
    asyncio.run(test_multi_store_disconnection())
