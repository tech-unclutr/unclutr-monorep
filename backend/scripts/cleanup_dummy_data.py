
import asyncio
import sys
import os
from sqlalchemy import text
from sqlmodel import select, delete
from uuid import UUID

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session
from app.models.user import User
from app.models.company import Company, Brand, Workspace
from app.models.integration import Integration
from app.models.campaign import Campaign

async def cleanup_dummy_data():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("🧹 STARTING TARGETED DATABASE CLEANUP")
    print("=" * 60)

    # 1. Targets to delete
    dummy_user_id = "dev-user-123"
    dummy_company_names = ["Dev Brand", "Test Brand"]
    dummy_campaign_names = ["Test Campaign 1"]
    
    # 2. Delete Dummy Companies and cascaded data
    print("🏢 Cleaning Dummy Companies...")
    for name in dummy_company_names:
        res = await session.execute(select(Company).where(Company.brand_name == name))
        companies = res.scalars().all()
        for co in companies:
            print(f"  🗑️ Deleting Company: {co.brand_name} ({co.id})")
            
            # Delete Brand Metrics and Insights first
            res_brands = await session.execute(select(Brand).where(Brand.company_id == co.id))
            brand_ids = [b.id for b in res_brands.scalars().all()]
            
            if brand_ids:
                print(f"    🗑️ Deleting brand metrics and insights for brands: {brand_ids}")
                await session.execute(text("DELETE FROM brand_metric WHERE brand_id = ANY(:ids)"), {"ids": brand_ids})
                await session.execute(text("DELETE FROM insight_feedback WHERE brand_id = ANY(:ids)"), {"ids": brand_ids})
                await session.execute(text("DELETE FROM insight_generation_log WHERE brand_id = ANY(:ids)"), {"ids": brand_ids})
                await session.execute(text("DELETE FROM insight_impression WHERE brand_id = ANY(:ids)"), {"ids": brand_ids})
                await session.execute(text("DELETE FROM insight_suppression WHERE brand_id = ANY(:ids)"), {"ids": brand_ids})

            # Delete related campaigns and their dependencies
            print("    🗑️ Deleting campaigns and leads...")
            await session.execute(text("DELETE FROM campaign_leads WHERE campaign_id IN (SELECT id FROM campaigns WHERE company_id = :cid)"), {"cid": co.id})
            await session.execute(text("DELETE FROM campaigns_goals_details WHERE campaign_id IN (SELECT id FROM campaigns WHERE company_id = :cid)"), {"cid": co.id})
            await session.execute(text("DELETE FROM archived_campaign_leads WHERE original_campaign_id IN (SELECT id FROM campaigns WHERE company_id = :cid)"), {"cid": co.id})
            await session.execute(text("DELETE FROM archived_campaigns WHERE company_id = :cid"), {"cid": co.id})
            await session.execute(delete(Campaign).where(Campaign.company_id == co.id))
            
            # Delete integrations
            print("    🗑️ Deleting integrations...")
            await session.execute(delete(Integration).where(Integration.company_id == co.id))
            
            # Delete Membership records (IAM)
            print("    🗑️ Deleting membership records...")
            await session.execute(text("DELETE FROM company_membership WHERE company_id = :cid"), {"cid": co.id})
            await session.execute(text("DELETE FROM workspace_membership WHERE workspace_id IN (SELECT id FROM workspace WHERE company_id = :cid)"), {"cid": co.id})
            
            # Delete workspaces and brands
            print("    🗑️ Deleting workspaces and brands...")
            await session.execute(delete(Workspace).where(Workspace.company_id == co.id))
            await session.execute(delete(Brand).where(Brand.company_id == co.id))
            
            # Delete Shopify related data
            print("    🗑️ Deleting Shopify data...")
            result = await session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'shopify_%'"))
            shopify_tables = [row[0] for row in result.all()]
            for table in shopify_tables:
                await session.execute(text(f"DELETE FROM {table} WHERE company_id = :cid"), {"cid": co.id})

            # Finally delete company
            await session.delete(co)

    # 3. Delete Dummy User
    print("\n👤 Cleaning Dummy User...")
    res = await session.execute(select(User).where(User.id == dummy_user_id))
    user = res.scalar_one_or_none()
    if user:
        print(f"  🗑️ Deleting User: {user.email} ({user.id})")
        # Clean session/request logs if any
        await session.execute(text("DELETE FROM all_requests WHERE user_id = :uid"), {"uid": dummy_user_id})
        await session.execute(text("DELETE FROM audit_trail WHERE actor_id = :uid"), {"uid": dummy_user_id})
        # Delete user's campaigns
        await session.execute(delete(Campaign).where(Campaign.user_id == dummy_user_id))
        await session.delete(user)

    # 4. Clean Duplicated Campaigns
    print("\n📣 Cleaning Duplicated Campaigns...")
    # These are real names but have multiple entries
    campaign_names_to_dedupe = ["Retention Jan 2026", "Retention Feb 2026", "Churn Feb 2026"]
    
    for name in campaign_names_to_dedupe:
        res = await session.execute(
            select(Campaign)
            .where(Campaign.name == name)
            .order_by(Campaign.created_at.asc())
        )
        campaigns = res.scalars().all()
        if len(campaigns) > 1:
            # Keep the first one (original)
            original = campaigns[0]
            to_delete = campaigns[1:]
            print(f"  🔍 Found {len(campaigns)} instances of '{name}'. Keeping original (ID: {original.id}, Created: {original.created_at})")
            for camp in to_delete:
                print(f"    🗑️ Deleting duplicate: {camp.id} (Created: {camp.created_at})")
                await session.execute(text("DELETE FROM campaign_leads WHERE campaign_id = :cid"), {"cid": camp.id})
                await session.execute(text("DELETE FROM campaigns_goals_details WHERE campaign_id = :cid"), {"cid": camp.id})
                await session.delete(camp)
    
    # 5. Generic "Test Campaign 1" Cleanup
    for name in dummy_campaign_names:
        print(f"  🗑️ Deleting all instances of '{name}'")
        await session.execute(delete(Campaign).where(Campaign.name == name))

    # 6. Final Commit
    try:
        await session.commit()
        print("\n✅ CLEANUP SUCCESSFUL")
    except Exception as e:
        print(f"\n❌ ERROR DURING CLEANUP: {e}")
        await session.rollback()
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(cleanup_dummy_data())
