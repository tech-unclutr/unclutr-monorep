"""
Script to show the actual Bolna API payload data being sent for campaign calls.
Uses the updated logic mirroring BolnaCaller.
"""
import asyncio
import json
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import engine
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.company import Company
from app.models.user import User
from app.core.config import settings


async def show_bolna_payload():
    """Show the actual payload that would be sent to Bolna for the latest campaign."""
    
    async with AsyncSession(engine) as session:
        # Get the most recent active campaign
        stmt = select(Campaign).where(Campaign.status.in_(["ACTIVE", "PAUSED"])).order_by(Campaign.created_at.desc())
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if not campaign:
            print("❌ No active or paused campaigns found")
            return
        
        print(f"\n{'='*80}")
        print(f"CAMPAIGN: {campaign.name}")
        print(f"Campaign ID: {campaign.id}")
        print(f"Status: {campaign.status}")
        print(f"{'='*80}\n")
        
        # Get company and user context
        company = await session.get(Company, campaign.company_id)
        user = await session.get(User, campaign.user_id)
        
        # Get a sample lead
        lead_stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign.id).limit(1)
        lead_result = await session.execute(lead_stmt)
        lead = lead_result.scalars().first()
        
        if not lead:
            print("❌ No leads found for this campaign")
            return
        
        # --- REPLICATE BOLNA_CALLER LOGIC ---
        
        # 1. Execution Window
        window_str = "No window scheduled"
        start_iso = datetime.utcnow().isoformat()
        end_iso = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        
        if campaign.execution_windows:
            try:
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
            except Exception as e:
                print(f"⚠️  Error parsing execution windows: {e}")
        
        # 2. Team Member First Name
        team_first_name = campaign.team_member_role or "Aditi"
        if user and user.full_name:
            team_first_name = user.full_name.split()[0]
        elif campaign.team_member_context and "conducted by" in campaign.team_member_context.lower():
            try:
                parts = campaign.team_member_context.split("conducted by ")[1].split()
                if parts: team_first_name = parts[0]
            except: pass
        
        # 3. Payload variables for the sample lead
        timezone = "Asia/Kolkata"
        cohort_name = lead.cohort
        cohort_qs = campaign.cohort_questions or {}
        cohort_incents = campaign.cohort_incentives or {}
        
        customer_first_name = (lead.customer_name or "there").split()[0]
        
        questions_list = None
        if cohort_name and cohort_name in cohort_qs:
            questions_list = cohort_qs[cohort_name]
        if not questions_list:
            questions_list = campaign.preliminary_questions
            
        incentive_val = None
        if cohort_name and cohort_name in cohort_incents:
            incentive_val = cohort_incents[cohort_name]
        if not incentive_val:
            incentive_val = campaign.incentive or ""

        variables = {
            "timezone": timezone,
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
        
        task_payload = {
            "recipient_phone_number": lead.contact_number,
            "agent_id": settings.BOLNA_AGENT_ID or "NOT_SET",
            "user_data": variables
        }
        
        # Display the payload
        print(f"{'='*80}")
        print("BOLNA API PAYLOAD (REPLICATED LOGIC)")
        print(f"{'='*80}\n")
        print(json.dumps(task_payload, indent=2))
        
        print(f"\n{'='*80}")
        print("VARIABLES BREAKDOWN")
        print(f"{'='*80}\n")
        for key, value in variables.items():
            print(f"  {key:25} : {value}")
        
        # Show specific lead verification
        print(f"\n{'='*80}")
        print("LEAD SPECIFIC VERIFICATION (Selected Cohorts Only)")
        print(f"{'='*80}\n")
        
        selected = campaign.selected_cohorts or []
        print(f"Selected Cohorts: {selected}")
        
        all_leads_stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign.id)
        all_leads_result = await session.execute(all_leads_stmt)
        all_leads = all_leads_result.scalars().all()
        
        count = 0
        for l in all_leads:
            if selected and l.cohort not in selected:
                continue
            
            count += 1
            if count > 10: break # Show first 10 selected
            
            l_customer_fn = (l.customer_name or "there").split()[0]
            l_qs = cohort_qs.get(l.cohort) if l.cohort in cohort_qs else campaign.preliminary_questions
            l_inc = cohort_incents.get(l.cohort) if l.cohort in cohort_incents else campaign.incentive
            
            print(f"  {count}. {l.customer_name:20} → First Name: {l_customer_fn:10} | Cohort: {l.cohort:15}")
            print(f"      Qs: {', '.join(l_qs) if l_qs else 'None'}")
            print(f"      Incentive: {l_inc}")

if __name__ == "__main__":
    asyncio.run(show_bolna_payload())
