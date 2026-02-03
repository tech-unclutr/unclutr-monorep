import httpx
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import settings
from app.models.campaign import Campaign
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign_lead import CampaignLead
from app.models.company import Company
from app.models.user import User


    
import pytz

class BolnaCaller:
    @staticmethod
    async def create_and_schedule_batch(
        session: AsyncSession, 
        campaign_id: UUID, 
        lead_ids: List[UUID], 
        queue_item_ids: List[UUID]
    ) -> Dict[str, Any]:
        """
        Triggers calls for a batch of leads using Bolna API.
        """
        
        # 1. Fetch Campaign Details
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
            
        settings_api_key = settings.BOLNA_API_KEY
        settings_agent_id = settings.BOLNA_AGENT_ID
        
        # 1.1 Fetch Context (Company & User)
        company = await session.get(Company, campaign.company_id)
        user = await session.get(User, campaign.user_id)
        
        # 1.2 Determine Earliest Execution Window
        window_str = "No window scheduled"
        
        # USE AWARE DATETIMES
        now_utc = datetime.now(pytz.utc)
        start_iso = now_utc.isoformat().replace('+00:00', 'Z')
        end_iso = (now_utc + timedelta(hours=1)).isoformat().replace('+00:00', 'Z')
        
        if campaign.execution_windows:
            try:
                # Sort by day and start time
                windows = sorted(campaign.execution_windows, key=lambda x: (x.get('day', ''), x.get('start', '')))
                
                # Find the current or next window
                active_window = None
                for w in windows:
                    day = w.get('day', '')
                    et = w.get('end', '')
                    if day and et:
                        # Parse end_dt as IST (Asia/Kolkata) since that's what the UI/user seems to use
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
                    
                    # BOLNA FIX: Ensure startTime/endTime are sent as UTC ISO with Z
                    # This tells Bolna explicitly that these are UTC, preventing IST assumptions on naive strings
                    start_dt_naive = datetime.fromisoformat(f"{day}T{st}:00")
                    # If start time is in the past, use 'now'
                    start_dt_ist = tz_ist.localize(start_dt_naive)
                    
                    effective_start = max(now_utc, start_dt_ist)
                    
                    start_iso = effective_start.astimezone(pytz.utc).isoformat().replace('+00:00', 'Z')
                    end_iso = end_dt.astimezone(pytz.utc).isoformat().replace('+00:00', 'Z')
                    
                    # Safety check: if end passed while processing
                    if now_utc > end_dt:
                         return {"status": "error", "error_type": "WINDOW_EXPIRED", "message": "Execution window has passed"}
                else:
                    # No future windows found - Fallback to 1-hour window from now
                    now_ist = now_utc.astimezone(pytz.timezone("Asia/Kolkata"))
                    day = now_ist.strftime("%Y-%m-%d")
                    st = now_ist.strftime("%H:%M")
                    et = (now_ist + timedelta(hours=1)).strftime("%H:%M")
                    
                    window_str = f"{day} {st} to {day} {et} IST"
                    
                    # Already set fallback ISOs at top of block
                    
                    print(f"[BolnaCaller] WARNING: No scheduled window found. Defaulting to fallback 1h window: {window_str}")
                    
            except Exception as e:
                print(f"[BolnaCaller] Error parsing execution windows: {e}")

        # 1.3 Team Member First Name
        team_first_name = campaign.team_member_role or "Aditi"
        if user and user.full_name:
            team_first_name = user.full_name.split()[0]
        elif campaign.team_member_context and "conducted by" in campaign.team_member_context.lower():
            # Fallback extraction from context if user object lacks name
            try:
                # e.g. "The interview will be conducted by Tanay (Founder...)"
                parts = campaign.team_member_context.split("conducted by ")[1].split()
                if parts: team_first_name = parts[0]
            except: pass
            
        timezone = "Asia/Kolkata" 
        
        if not settings_api_key:
             print("[BolnaCaller] ERROR: BOLNA_API_KEY not set in config.")
             return {"status": "error", "message": "Missing API Key"}

        if not settings_agent_id:
             print("[BolnaCaller] ERROR: BOLNA_AGENT_ID not set in config.")
             return {"status": "error", "message": "Missing Agent ID"}

        # 2. Prepare Batch Payload
        tasks = []
        
        for idx, lead_id in enumerate(lead_ids):
            lead = await session.get(CampaignLead, lead_id)
            if not lead:
                continue
                
            queue_item_id = queue_item_ids[idx]
            
            # Correctly handle questions and incentives (Real cohort data)
            cohort_name = lead.cohort
            cohort_qs = campaign.cohort_questions or {}
            cohort_incents = campaign.cohort_incentives or {}
            
            # 1. Use lead's first name
            customer_first_name = (lead.customer_name or "there").split()[0]

            # 2. Preliminary Questions (Cohort-specific fallback to global)
            questions_list = None
            if cohort_name and cohort_name in cohort_qs:
                questions_list = cohort_qs[cohort_name]
            
            if not questions_list:
                questions_list = campaign.preliminary_questions
            
            # 3. Incentive (Cohort-specific fallback to global)
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
            
            # --- Normalize Phone Number ---
            raw_number = lead.contact_number or ""
            # Remove all non-numeric characters except +
            clean_number = "".join(filter(lambda x: x.isdigit() or x == '+', raw_number))
            
            # Logic: If it's a 10 digit number, assume +91
            if len(clean_number) == 10 and clean_number.isdigit():
                clean_number = f"+91{clean_number}"
            # If it starts with 0 and followed by 10 digits
            elif len(clean_number) == 11 and clean_number.startswith('0'):
                clean_number = f"+91{clean_number[1:]}"
            # If it doesn't start with +, add it
            elif not clean_number.startswith('+'):
                clean_number = f"+{clean_number}"

            task_payload = {
                "recipient_phone_number": clean_number, 
                "agent_id": settings_agent_id,
                "user_data": variables  # Bolna expects user_data for variables
            }
            
            tasks.append(task_payload)

            # NOTE: If Bolna API requires ONE call per request, we loop. 
            # If it supports batch, we send list. 
            # implementation_plan said "batch", assuming `POST /batch`.
            # Let's assume singular call loop for safety unless docs say otherwise.
        
        # 3. Execute Calls (Loop for now)
        results = []
        async with httpx.AsyncClient() as client:
            for i, task in enumerate(tasks):
                try:
                    # Replace with actual Bolna Endpoint
                    url = f"{settings.BOLNA_API_BASE_URL}/call" 
                    headers = {"Authorization": f"Bearer {settings_api_key}"}
                    
                    print(f"[BolnaCaller] Triggering call to {task['recipient_phone_number']} via {url}")
                    response = await client.post(url, json=task, headers=headers, timeout=10.0)
                    if response.status_code >= 400:
                         print(f"[BolnaCaller] API Error ({response.status_code}): {response.text}")
                    response.raise_for_status()
                    data = response.json()
                    
                    # 4. Save Execution Map
                    call_id = data.get("execution_id") or data.get("run_id") or data.get("call_id") or data.get("id") or f"mock-{uuid4()}" # Fallback
                    
                    execution_map = BolnaExecutionMap(
                        queue_item_id=queue_item_ids[i],
                        campaign_id=campaign_id,
                        bolna_call_id=call_id,
                        bolna_agent_id=settings_agent_id or "unknown",
                        call_status="initiated"
                    )
                    session.add(execution_map)

                    # 5. [NEW] Create Persistent Call Log
                    
                    from app.models.call_log import CallLog
                    
                    # Extract lead_id from queue_item_ids map or direct index
                    # We have lead_ids list and queue_item_ids list aligned by index i
                    current_lead_id = lead_ids[i]

                    call_log = CallLog(
                        campaign_id=campaign_id,
                        lead_id=current_lead_id,
                        bolna_call_id=call_id,
                        bolna_agent_id=settings_agent_id or "unknown",
                        status="initiated",
                        webhook_payload=data # Initial response data
                    )
                    session.add(call_log)

                    results.append({"status": "success", "call_id": call_id})
                    
                except Exception as e:
                    error_msg = str(e)
                    # Try to be more specific for unverified numbers or other common data issues
                    if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 400:
                        try:
                            err_data = e.response.json()
                            bolna_msg = err_data.get("message", "")
                            if "verified phone numbers" in bolna_msg:
                                error_msg = "Your customer data for this customer is incorrect (Unverified number)"
                        except:
                            pass
                    
                    print(f"[BolnaCaller] Failed to trigger call for {task['recipient_phone_number']}: {error_msg}")
                    results.append({"status": "error", "error": error_msg})



        
        await session.commit()
        return {"results": results, "count": len(results)}
