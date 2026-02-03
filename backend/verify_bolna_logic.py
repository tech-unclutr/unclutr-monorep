import asyncio
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta
from uuid import uuid4

import pytz

class Campaign: pass
class Company: pass
class User: pass
class CampaignLead: pass

async def test_bolna_payload_logic():
    # 1. Setup Mock Data
    campaign_id = uuid4()
    company_id = uuid4()
    user_id = str(uuid4())
    
    mock_campaign = MagicMock()
    mock_campaign.id = campaign_id
    mock_campaign.company_id = company_id
    mock_campaign.user_id = user_id
    mock_campaign.name = "Global Campaign"
    mock_campaign.execution_windows = [
        {'day': '2026-02-05', 'start': '10:00', 'end': '12:00'},
        {'day': '2026-02-01', 'start': '19:00', 'end': '23:00'}, 
    ]
    mock_campaign.cohort_questions = {
        "VIP": ["How do you like our premium service?"],
    }
    mock_campaign.cohort_incentives = {
        "VIP": "Free Upgrade",
    }
    mock_campaign.preliminary_questions = ["Generic Q1", "Generic Q2"]
    mock_campaign.incentive = "$5 Discount"
    
    mock_company = MagicMock()
    mock_company.brand_name = "PremiumBrand"
    
    mock_user = MagicMock()
    mock_user.full_name = "Param Singh"
    
    mock_lead_vip = MagicMock()
    mock_lead_vip.customer_name = "John Doe"
    mock_lead_vip.cohort = "VIP"
    mock_lead_vip.contact_number = "+1234567890"

    mock_lead_norm = MagicMock()
    mock_lead_norm.customer_name = "Jane Smith"
    mock_lead_norm.cohort = "Normal"
    mock_lead_norm.contact_number = "+1987654321"

    # 2. Mock Session
    session = AsyncMock()
    async def get_mock(model, id):
        if model is Campaign: return mock_campaign
        if model is Company: return mock_company
        if model is User: return mock_user
        if model is CampaignLead:
            if id == "vip": return mock_lead_vip
            if id == "norm": return mock_lead_norm
        return None
    
    session.get.side_effect = get_mock

    # 3. Simulate part of BolnaCaller logic
    print("--- Simulating BolnaCaller Logic ---")
    
    # NEW LOGIC from bolna_caller.py
    campaign = await session.get(Campaign, campaign_id)
    company = await session.get(Company, campaign.company_id)
    user = await session.get(User, campaign.user_id)
    
    window_str = "No window scheduled"
    now_utc = datetime.now(pytz.utc)
    start_iso = now_utc.isoformat().replace('+00:00', 'Z')
    end_iso = (now_utc + timedelta(hours=1)).isoformat().replace('+00:00', 'Z')
    
    if campaign.execution_windows:
        try:
            windows = sorted(campaign.execution_windows, key=lambda x: (x.get('day', ''), x.get('start', '')))
            
            active_window = None
            for w in windows:
                day = w.get('day', '')
                et = w.get('end', '')
                if day and et:
                    tz_ist = pytz.timezone("Asia/Kolkata")
                    end_dt_naive = datetime.fromisoformat(f"{day}T{et}:00")
                    end_dt = tz_ist.localize(end_dt_naive)
                    
                    if end_dt > now_utc:
                        active_window = w
                        break
            
            if active_window:
                day = active_window.get('day', '')
                st = active_window.get('start', '')
                et = active_window.get('end', '')
                
                window_str = f"{day} {st} to {day} {et} IST"
                
                start_dt_naive = datetime.fromisoformat(f"{day}T{st}:00")
                start_dt_ist = tz_ist.localize(start_dt_naive)
                
                effective_start = max(now_utc, start_dt_ist)
                
                start_iso = effective_start.astimezone(pytz.utc).isoformat().replace('+00:00', 'Z')
                end_iso = end_dt.astimezone(pytz.utc).isoformat().replace('+00:00', 'Z')
                
        except Exception as e:
            print(f"Error simulation: {e}")

    print(f"Brand Name: {company.brand_name}")
    print(f"Earliest Window String: {window_str}")
    print(f"Start ISO (UTC with Z): {start_iso}")
    print(f"End ISO (UTC with Z): {end_iso}")

    
    # Loop over leads
    leads = ["vip", "norm"]
    for lid in leads:
        lead = await session.get(CampaignLead, lid)
        print(f"\nLead: {lead.customer_name} (Cohort: {lead.cohort})")
        
        cohort_name = lead.cohort
        cohort_qs = campaign.cohort_questions or {}
        cohort_incents = campaign.cohort_incentives or {}
        
        questions_list = cohort_qs.get(cohort_name) if cohort_name else None
        if not questions_list:
            questions_list = campaign.preliminary_questions
        
        incentive_val = cohort_incents.get(cohort_name) if cohort_name else None
        if not incentive_val:
            incentive_val = campaign.incentive or ""

        timezone = "Asia/Kolkata"
        team_first_name = "Param"

        variables = {
            "timezone": timezone,
            "customer_name": lead.customer_name or "there",
            "brand_name": company.brand_name if company else campaign.name,
            "team_member_name": team_first_name,
            "preliminary_questions": ", ".join(questions_list) if questions_list else "None",
            "incentive": incentive_val,
            "execution_window": window_str,
            "startTime": start_iso,
            "endTime": end_iso,
        }
        print(f"Variables: {variables}")

if __name__ == "__main__":
    asyncio.run(test_bolna_payload_logic())
