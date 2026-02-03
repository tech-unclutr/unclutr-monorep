import asyncio
import json
from uuid import UUID
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import engine
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.company import Company
from app.models.user import User

async def show_all_leads_payload(campaign_id_str):
    async with AsyncSession(engine) as session:
        campaign_id = UUID(campaign_id_str)
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print(f"Campaign {campaign_id_str} not found")
            return
            
        # Find all leads for this campaign
        lead_stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        result = await session.execute(lead_stmt)
        leads = result.scalars().all()
        
        if not leads:
            print(f"No leads found in campaign {campaign_id_str}")
            return
            
        print(f"--- Found {len(leads)} leads for campaign '{campaign.name}' ---")
            
        # Context
        company = await session.get(Company, campaign.company_id)
        user = await session.get(User, campaign.user_id)
        
        # 1. Execution Window Logic (Shared for campaign)
        window_str = "No window scheduled"
        start_iso = datetime.utcnow().isoformat()
        end_iso = "N/A"
        
        if campaign.execution_windows:
            windows = sorted(campaign.execution_windows, key=lambda x: (x.get('day', ''), x.get('start', '')))
            now_utc = datetime.utcnow()
            active_window = None
            for w in windows:
                day = w.get('day', '')
                et = w.get('end', '')
                if day and et:
                    end_dt = datetime.fromisoformat(f"{day}T{et}:00")
                    if end_dt > now_utc:
                        active_window = w
                        break
            
            if active_window:
                day = active_window.get('day', '')
                st = active_window.get('start', '')
                et = active_window.get('end', '')
                window_str = f"{day} {st} to {day} {et} IST"
                start_iso = now_utc.isoformat()
                end_iso = f"{day}T{et}:00"
            else:
                window_str = "EXPIRED"

        # 2. Team Member First Name (Shared)
        team_first_name = campaign.team_member_role or "Aditi"
        if user and user.full_name:
            team_first_name = user.full_name.split()[0]
        elif campaign.team_member_context and "conducted by" in campaign.team_member_context.lower():
            try:
                parts = campaign.team_member_context.split("conducted by ")[1].split()
                if parts: team_first_name = parts[0]
            except: pass

        for lead in leads:
            # 3. Cohort Specifics (Per Lead)
            cohort_qs = campaign.cohort_questions or {}
            cohort_incents = campaign.cohort_incentives or {}
            
            customer_first_name = (lead.customer_name or "there").split()[0]
            
            questions_list = None
            if lead.cohort and lead.cohort in cohort_qs:
                questions_list = cohort_qs[lead.cohort]
            if not questions_list:
                questions_list = campaign.preliminary_questions
                
            incentive_val = None
            if lead.cohort and lead.cohort in cohort_incents:
                incentive_val = cohort_incents[lead.cohort]
            if not incentive_val:
                incentive_val = campaign.incentive or ""

            variables = {
                "timezone": "Asia/Kolkata",
                "customer_name": customer_first_name,
                "brand_name": company.brand_name if company else (campaign.name or "Our Brand"),
                "brand_context": campaign.brand_context or "Standard Retail Brand",
                "customer_context": campaign.customer_context or "Recent Customer",
                "team_member_context": campaign.team_member_context or "Customer Success Manager",
                "team_member_name": team_first_name,
                "preliminary_questions": ", ".join(questions_list) if questions_list else "None",
                "incentive": incentive_val,
                "execution_window": window_str,
                "startTime": start_iso,
                "endTime": end_iso,
            }
            
            print(f"\n{'='*40}")
            print(f"LEAD: {lead.customer_name} ({lead.cohort})")
            print(f"{'='*40}")
            print(json.dumps(variables, indent=2))

if __name__ == "__main__":
    asyncio.run(show_all_leads_payload("7b277bac-9157-4c01-9b6e-3b28b088e0b4"))
