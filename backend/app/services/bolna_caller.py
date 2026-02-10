import asyncio
from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID, uuid4

import httpx
import pytz
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, desc 
from loguru import logger

from app.core.config import settings
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.company import Company
from app.models.queue_item import QueueItem
from app.models.user import User
from app.models.call_log import CallLog


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
        
        # 1.2 Determine Active Execution Window
        window_str = "No window scheduled"
        
        # USE AWARE DATETIMES
        now_utc = datetime.now(pytz.utc)
        tz_ist = pytz.timezone("Asia/Kolkata")
        
        active_window = None
        if campaign.execution_windows:
            try:
                # Find the window where 'now' falls between start and end
                for w in campaign.execution_windows:
                    day = w.get('day', '')
                    st = w.get('start', '')
                    et = w.get('end', '')
                    if day and st and et:
                        start_dt = tz_ist.localize(datetime.fromisoformat(f"{day}T{st}:00"))
                        end_dt = tz_ist.localize(datetime.fromisoformat(f"{day}T{et}:00"))
                        
                        if start_dt <= now_utc <= end_dt:
                            active_window = w
                            break
                
                if active_window:
                    day = active_window.get('day', '')
                    st = active_window.get('start', '')
                    et = active_window.get('end', '')
                    
                    # Exact format requested: YYYY-MM-DD HH:MM to YYYY-MM-DD HH:MM IST
                    window_str = f"{day} {st} to {day} {et} IST"
                    
                    # BOLNA FIX: Exact naive ISO format requested: YYYY-MM-DDTHH:MM:SS
                    start_dt = tz_ist.localize(datetime.fromisoformat(f"{day}T{st}:00"))
                    end_dt = tz_ist.localize(datetime.fromisoformat(f"{day}T{et}:00"))
                    
                    start_iso = start_dt.strftime("%Y-%m-%dT%H:%M:%S")
                    end_iso = end_dt.strftime("%Y-%m-%dT%H:%M:%S")
                else:
                    # No active window found - Prevent call
                    logger.error(f"[BolnaCaller] ERROR: No active execution window for campaign {campaign.id}. 'Now' is {now_utc.astimezone(tz_ist)}")
                    return {"status": "error", "error_type": "WINDOW_EXPIRED", "message": "No active execution window found for the current time."}
                    
            except Exception as e:
                logger.error(f"[BolnaCaller] Error parsing execution windows: {e}")
                return {"status": "error", "message": f"Error parsing execution windows: {e}"}
        else:
            # No windows defined at all
            return {"status": "error", "error_type": "WINDOW_EXPIRED", "message": "No execution windows defined for this campaign."}

        # 1.3 Team Member First Name
        team_first_name = (user.designation if user else None) or "Aditi"
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
             logger.error("[BolnaCaller] ERROR: BOLNA_API_KEY not set in config.")
             return {"status": "error", "message": "Missing API Key"}

        if not settings_agent_id:
             logger.error("[BolnaCaller] ERROR: BOLNA_AGENT_ID not set in config.")
             return {"status": "error", "message": "Missing Agent ID"}

        # 2. Prepare Batch Payload
        tasks = []
        
        for idx, lead_id in enumerate(lead_ids):
            lead = await session.get(CampaignLead, lead_id)
            if not lead:
                continue

            queue_item_id = queue_item_ids[idx]
            q_item = await session.get(QueueItem, queue_item_id)
            
            # [HARD GUARDRAIL] Redundant safety check
            # We allow execution_count == 2 (that's the 2nd call), but not more.
            # Note: QueueWarmer increments count BEFORE calling this, so a valid 2nd call will have count=2 here.
            if q_item and q_item.execution_count > 2:
                logger.warning(f"[BolnaCaller] HARD GUARDRAIL: Skipping call for lead {lead.id} - Execution count {q_item.execution_count} exceeds limit.")
                continue

            
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
                "call_length_planned": BolnaCaller._human_readable_duration(campaign.call_duration or 600),
                "startTime": start_iso,
                "endTime": end_iso,
            }

            # [CONTEXT LOGIC] If this is a follow-up call (execution_count > 1), fetch previous call transcript
            if q_item and q_item.execution_count > 1:
                try:
                    # Fetch the latest call log for this lead and campaign
                    statement = (
                        select(CallLog)
                        .where(CallLog.lead_id == lead.id)
                        .where(CallLog.campaign_id == campaign.id)
                        .order_by(desc(CallLog.created_at))
                        .limit(1)
                    )
                    result = await session.exec(statement)
                    last_call = result.first()
                    
                    if last_call:
                        # Prefer full_transcript, fallback to transcript_summary
                        previous_transcript = last_call.full_transcript or last_call.transcript_summary or "No transcript available."
                        variables["last_call_context"] = previous_transcript
                        logger.info(f"[BolnaCaller] Injected last_call_context for lead {lead.id}: {previous_transcript[:50]}...")
                    else:
                         logger.warning(f"[BolnaCaller] Warning: Execution count is {q_item.execution_count} but no previous CallLog found for lead {lead.id}")
                except Exception as e:
                    logger.error(f"[BolnaCaller] Error fetching previous context: {e}")

            
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
        
        # 3. Execute Calls (Concurrent)
        results = []
        sent_numbers = set() # Safety check for intra-batch duplicates
        
        # [FIX] Auto-detect Ngrok URL for Webhook
        # This ensures real-time updates work in dev environment without manual config
        webhook_url = None
        try:
            async with httpx.AsyncClient() as client:
                # Try fetching from local Ngrok API
                ngrok_res = await client.get("http://localhost:4040/api/tunnels", timeout=0.5)
                if ngrok_res.status_code == 200:
                    tunnels = ngrok_res.json().get("tunnels", [])
                    # Find https tunnel
                    public_url = next((t["public_url"] for t in tunnels if t["proto"] == "https"), None)
                    if public_url:
                        webhook_url = f"{public_url}/api/v1/integrations/webhook/bolna"
                        logger.info(f"[BolnaCaller] Auto-detected Ngrok Webhook URL: {webhook_url}")
        except Exception:
            # Silently fail if ngrok API is not accessible (e.g. prod)
            pass

        # Define internal helper for single concurrent call
        async def params_trigger_single_call(client, task, original_index, url, headers):
            current_number = task["recipient_phone_number"]
            try:
                logger.info(f"[BolnaCaller] Triggering call to {current_number} via {url}")
                logger.info(f"[BolnaCaller] Payload for {current_number}: {task}") 
                
                # Using a longer timeout since we are firing many at once, though awaiting them concurrently 
                # effectively reduces total wait time, individual request might still take a moment.
                response = await client.post(url, json=task, headers=headers, timeout=15.0)
                
                if response.status_code >= 400:
                        logger.error(f"[BolnaCaller] API Error for {current_number} ({response.status_code}): {response.text}")
                
                response.raise_for_status()
                data = response.json()
                logger.info(f"[BolnaCaller] Success response for {current_number}: {data}")
                
                return {
                    "status": "success", 
                    "original_index": original_index,
                    "data": data,
                    "phone": current_number
                }
            except Exception as e:
                error_msg = str(e)
                if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 400:
                    try:
                        err_data = e.response.json()
                        bolna_msg = err_data.get("message", "")
                        if "verified phone numbers" in bolna_msg:
                            error_msg = "Unverified Phone Number (Telephony Error)"
                        else:
                            error_msg = f"Bolna API Error: {bolna_msg}"
                    except:
                        pass
                
                logger.error(f"[BolnaCaller] Failed to trigger call for {current_number}: {error_msg}")
                # [FIX]: Return the actual error message so QueueWarmer can mark it as FAILED outcome
                return {
                    "status": "error", 
                    "original_index": original_index,
                    "error": error_msg,
                    "phone": current_number
                }

        # Prepare coroutines
        async with httpx.AsyncClient() as client:
            coros = []
            
            # Pre-calc headers/url
            url = f"{settings.BOLNA_API_BASE_URL}/call" 
            headers = {"Authorization": f"Bearer {settings_api_key}"}

            for i, task in enumerate(tasks):
                current_number = task["recipient_phone_number"]
                
                if current_number in sent_numbers:
                    logger.warning(f"[BolnaCaller] Safety: Skipping duplicate number {current_number} in batch.")
                    results.append({"status": "error", "error": "Duplicate phone number in batch"})
                    continue
                
                sent_numbers.add(current_number)

                # Inject Webhook URL if detected
                if webhook_url:
                    task["webhook_url"] = webhook_url 
                    if "user_data" in task:
                        task["user_data"]["webhook_endpoint"] = webhook_url

                coros.append(params_trigger_single_call(client, task, i, url, headers))

            if not coros:
                 # await session.commit() # Pass up
                 return {"results": results, "count": len(results)}

            # Run all network requests concurrently!
            logger.info(f"[BolnaCaller] Awaiting {len(coros)} concurrent calls...")
            concurrent_results = await asyncio.gather(*coros, return_exceptions=True)
            
            # Process results sequentially to update DB (Session is not thread-safe)
            for res in concurrent_results:
                if isinstance(res, Exception):
                    # Should be covered by internal try/except but just in case
                    logger.error(f"[BolnaCaller] Unexpected concurrent error: {res}")
                    results.append({"status": "error", "error": str(res)})
                    continue
                    
                i = res["original_index"]
                
                if res["status"] == "error":
                    results.append({"status": "error", "error": res["error"]})
                    continue
                
                # Success path
                data = res["data"]
                call_id = data.get("execution_id") or data.get("run_id") or data.get("call_id") or data.get("id") or f"mock-{uuid4()}"
                
                # 4. Save Execution Map (Session add is synchronous and fast)
                execution_map = BolnaExecutionMap(
                    queue_item_id=queue_item_ids[i],
                    campaign_id=campaign_id,
                    bolna_call_id=call_id,
                    bolna_agent_id=settings_agent_id or "unknown",
                    call_status="initiated",
                    total_cost=0.0,
                    currency="USD",
                    call_duration=0
                )
                session.add(execution_map)

                # 5. Create Persistent Call Log
                current_lead_id = lead_ids[i]

                call_log = CallLog(
                    campaign_id=campaign_id,
                    lead_id=current_lead_id,
                    bolna_call_id=call_id,
                    bolna_agent_id=settings_agent_id or "unknown",
                    status="initiated",
                    webhook_payload=data,
                    duration=0,
                    total_cost=0.0,
                    currency="USD"
                )
                session.add(call_log)
                results.append({"status": "success", "call_id": call_id})

        await session.flush() # Replaced commit with flush
        return {"results": results, "count": len(results)}

    @staticmethod
    def _human_readable_duration(seconds: int) -> str:
        """Converts seconds into a natural-sounding string like '10 minutes'."""
        if not seconds or seconds <= 0:
            return "0 seconds"
            
        minutes = seconds // 60
        remaining_seconds = seconds % 60
        
        parts = []
        if minutes > 0:
            parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
        if remaining_seconds > 0:
            parts.append(f"{remaining_seconds} second{'s' if remaining_seconds != 1 else ''}")
            
        if len(parts) == 0:
            return "0 seconds"
        return " and ".join(parts)
