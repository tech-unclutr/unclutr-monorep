import pytest
import pytest_asyncio
import uuid
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.core.context import set_company_ctx, set_user_ctx
from app.models.company import Company, Workspace, Brand
from app.models.integration import Integration, IntegrationStatus
from app.models.datasource import DataSource, DataSourceCategory

@pytest_asyncio.fixture
async def db_session():
    # Use a separate session for testing, rollback after test ideally, 
    # but for simple verification we just create/delete or use unique IDs.
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

@pytest.mark.asyncio
async def test_cross_tenant_isolation(db_session: AsyncSession):
    # 1. Setup Data
    # Company A
    company_a = Company(name=f"Comp A {uuid.uuid4()}", currency="USD")
    db_session.add(company_a)
    await db_session.commit()
    await db_session.refresh(company_a)
    
    # Company B
    company_b = Company(name=f"Comp B {uuid.uuid4()}", currency="USD")
    db_session.add(company_b)
    await db_session.commit()
    await db_session.refresh(company_b)

    # Datasource (Shared global)
    ds = DataSource(
        name=f"Shopify {uuid.uuid4()}", 
        slug=f"shopify-{uuid.uuid4()}", 
        category=DataSourceCategory.Storefront
    )
    db_session.add(ds)
    await db_session.commit()
    await db_session.refresh(ds)

    # Workspace A (in Company A)
    # Note: Stamping might auto-inject company_id if context is set, 
    # but here we set explicitly to be sure.
    brand_a = Brand(name="Brand A", company_id=company_a.id)
    db_session.add(brand_a)
    await db_session.commit()
    await db_session.refresh(brand_a)

    workspace_a = Workspace(name="WS A", company_id=company_a.id, brand_id=brand_a.id)
    db_session.add(workspace_a)
    await db_session.commit()
    await db_session.refresh(workspace_a)

    # Integration A (Belongs to Company A)
    # We must start with Company A context to emulate a real creation flow, 
    # OR explicitly set company_id if we want to bypass stamping (but stamping logic might override?)
    # Stamping logic says: "if company_id in context, enforce it on all scoped models".
    # And "if hasattr(obj, company_id) -> obj.company_id = company_id".

    # Let's try creating WITH context A to verify creation stamping too.
    set_company_ctx(company_a.id)
    
    integration_a = Integration(
        workspace_id=workspace_a.id,
        datasource_id=ds.id,
        status=IntegrationStatus.ACTIVE
    )
    db_session.add(integration_a)
    await db_session.commit()
    await db_session.refresh(integration_a)
    
    assert integration_a.company_id == company_a.id, "Stamping failed to set company_id"

    # 2. Test Isolation
    
    # Switch Context to Company B
    set_company_ctx(company_b.id)
    
    # Try to fetch Integration A by ID
    query = select(Integration).where(Integration.id == integration_a.id)
    result = await db_session.exec(query)
    fetched_int = result.first()
    
    # SHould be NONE because context B filters for company_id=B
    assert fetched_int is None, "Cross-tenant leak! Tenant B readable Tenant A data."
    
    # 3. Test Access with Correct Context
    set_company_ctx(company_a.id)
    result = await db_session.exec(query)
    fetched_int = result.first()
    
    assert fetched_int is not None
    assert fetched_int.id == integration_a.id

    # 4. Cleanup (Optional, verifying read isolation is main goal)
