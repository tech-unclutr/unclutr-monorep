import asyncio
import logging
from uuid import uuid4, UUID
from datetime import datetime
from sqlalchemy import text, select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.db import engine
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.call_log import CallLog
from app.services.intelligence.campaign_service import campaign_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def reproduce():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # 1. Setup
            company_id = uuid4()
            user_id = str(uuid4())
            
            logger.info("Creating test campaign...")
            campaign = Campaign(
                id=uuid4(),
                company_id=company_id,
                user_id=user_id,
                name="Test Refined Leads Campaign",
                status="DRAFT"
            )
            session.add(campaign)
            await session.commit()
            await session.refresh(campaign)
            
            logger.info("Creating two test leads...")
            # Lead 1: Will be called (Preserved)
            lead_called = CampaignLead(
                id=uuid4(),
                campaign_id=campaign.id,
                customer_name="Called Customer",
                contact_number="+1111111111",
                cohort="Old Cohort"
            )
            # Lead 2: Won't be called (Removable)
            lead_uncalled = CampaignLead(
                id=uuid4(),
                campaign_id=campaign.id,
                customer_name="Uncalled Customer",
                contact_number="+2222222222",
                cohort="Old Cohort"
            )
            session.add_all([lead_called, lead_uncalled])
            await session.commit()
            
            logger.info(f"Creating call log for lead {lead_called.id}...")
            call_log = CallLog(
                campaign_id=campaign.id,
                lead_id=lead_called.id,
                bolna_call_id=f"test-call-{uuid4()}",
                bolna_agent_id="test-agent",
                status="completed"
            )
            session.add(call_log)
            await session.commit()
            
            # 2. Test Selective Replacement
            logger.info("--- Testing Selective Replacement ---")
            new_leads = [
                # Same number, different cohort -> Should ADD new record
                {"customer_name": "Called Customer", "contact_number": "+1111111111", "cohort": "New Cohort"},
                # New customer -> Should INSERT
                {"customer_name": "New Customer", "contact_number": "+3333333333", "cohort": "New Cohort"}
            ]
            
            await campaign_service.replace_campaign_leads(session, campaign.id, new_leads)
            logger.info("Lead replacement SUCCEEDED.")
            
            # 3. Verify Results
            from app.models.archived_campaign_lead import ArchivedCampaignLead
            
            # Check active leads
            stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign.id)
            res = await session.execute(stmt)
            active_leads = res.scalars().all()
            
            logger.info(f"Active leads after update: {[ (l.customer_name, l.cohort) for l in active_leads ]}")
            # Expected: 
            # 1. Called Customer (Old Cohort) - Preserved
            # 2. Called Customer (New Cohort) - Inserted
            # 3. New Customer (New Cohort) - Inserted
            assert len(active_leads) == 3, f"Expected 3 leads, got {len(active_leads)}"
            
            # Verify preservation of called lead exactly as is
            called_preserved = [l for l in active_leads if l.customer_name == "Called Customer" and l.cohort == "Old Cohort"]
            assert len(called_preserved) == 1, "Called lead in Old Cohort was not preserved!"
            
            # Verify addition of new cohort for called lead
            called_new_cohort = [l for l in active_leads if l.customer_name == "Called Customer" and l.cohort == "New Cohort"]
            assert len(called_new_cohort) == 1, "Called lead in New Cohort was not added!"
            
            # Verify removable was removed
            uncalled_remained = [l for l in active_leads if l.customer_name == "Uncalled Customer"]
            assert len(uncalled_remained) == 0, "Uncalled lead was not removed!"
            
            # Check archive
            stmt_arch = select(ArchivedCampaignLead).where(ArchivedCampaignLead.original_campaign_id == campaign.id)
            res_arch = await session.execute(stmt_arch)
            archived = res_arch.scalars().all()
            logger.info(f"Archived leads: {[ l.customer_name for l in archived ]}")
            assert len(archived) == 1, f"Expected 1 archived lead, got {len(archived)}"
            assert archived[0].customer_name == "Uncalled Customer"

            # 4. Test Campaign Deletion (CASCADE Test)
            logger.info("--- Testing Full Campaign Deletion (Cascade) ---")
            success = await campaign_service.delete_campaign(session, campaign.id, company_id)
            assert success is True, "Campaign deletion failed"
            
            # Verify Cascade
            stmt_logs = select(CallLog).where(CallLog.campaign_id == campaign.id)
            res_logs = await session.execute(stmt_logs)
            remaining_logs = res_logs.scalars().all()
            assert len(remaining_logs) == 0, "Call logs were NOT cascaded!"
            
            logger.info("ALL TESTS PASSED!")

        except Exception as e:
            logger.error(f"Test failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            await session.rollback()
        finally:
            # Final Cleanup
            try:
                await session.execute(text("DELETE FROM call_logs WHERE campaign_id = :cid"), {"cid": campaign.id})
                await session.execute(text("DELETE FROM campaign_leads WHERE campaign_id = :cid"), {"cid": campaign.id})
                await session.execute(text("DELETE FROM campaigns WHERE id = :cid"), {"cid": campaign.id})
                await session.execute(text("DELETE FROM archived_campaign_leads WHERE original_campaign_id = :cid"), {"cid": campaign.id})
                await session.execute(text("DELETE FROM archived_campaigns WHERE original_campaign_id = :cid"), {"cid": campaign.id})
                await session.commit()
            except:
                pass

if __name__ == "__main__":
    asyncio.get_event_loop().run_until_complete(reproduce())
