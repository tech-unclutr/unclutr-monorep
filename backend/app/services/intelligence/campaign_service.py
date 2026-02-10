import json
import logging
from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID, uuid4

from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.archived_campaign import ArchivedCampaign
from app.models.archived_campaign_lead import ArchivedCampaignLead
from app.models.campaign import Campaign
from app.models.campaign_goal_detail import CampaignGoalDetail
from app.models.campaign_lead import CampaignLead

from app.services.intelligence.llm_service import llm_service

logger = logging.getLogger(__name__)

class CampaignService:
    async def create_initial_campaign(
        self,
        session: AsyncSession,
        company_id: UUID,
        user_id: str,
        phone_number: str
    ) -> Campaign:
        """
        Create initial campaign record before triggering phone call.
        
        Args:
            session: Database session
            company_id: Company UUID
            user_id: User ID
            phone_number: Team member's phone number
            
        Returns:
            Created campaign record
        """
        logger.info(f"Creating initial campaign for {phone_number}")
        
        campaign = Campaign(
            company_id=company_id,
            user_id=user_id,
            name="Campaign Planning Call",  # Temporary name
            status="INITIATED"
        )
        
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        logger.info(f"Initial campaign {campaign.id} created and committed. User: {user_id}")
        return campaign
        
    async def update_campaign_execution_id(
        self,
        session: AsyncSession,
        campaign_id: UUID,
        new_execution_id: str
    ) -> Campaign:
        """
        Update campaign with new execution ID for retry.
        
        Args:
            session: Database session
            campaign_id: Campaign UUID
            new_execution_id: New Bolna execution ID
            
        Returns:
            Updated campaign record
        """
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
            
        campaign.bolna_execution_id = new_execution_id
        campaign.status = "INITIATED"
        campaign.updated_at = datetime.utcnow()
        
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        logger.info(f"Campaign {campaign.id} updated with new execution ID {new_execution_id}")
        return campaign


    
    async def update_campaign_from_bolna_webhook(
        self,
        session: AsyncSession,
        execution_id: str,
        bolna_payload: dict
    ) -> Campaign:
        """
        Update campaign with data from Bolna webhook.
        
        Args:
            session: Database session
            execution_id: Bolna execution ID
            bolna_payload: Parsed webhook payload from Bolna
            
        Returns:
            Updated campaign record
        """
        logger.info(f"Updating campaign from Bolna webhook for execution {execution_id}")
        
        
        # 1. Try finding campaign by ID (passed in context_data)
        campaign_id = bolna_payload.get("campaign_id")
        campaign = None
        
        if campaign_id:
            try:
                # Validate UUID format
                campaign_uuid = UUID(campaign_id)
                campaign = await session.get(Campaign, campaign_uuid)
                if campaign:
                    logger.info(f"Found campaign {campaign.id} via payload campaign_id")
            except ValueError:
                logger.warning(f"Invalid campaign_id received in webhook: {campaign_id}")

        # 2. Fallback: Find campaign by execution ID
        if not campaign:
            stmt = select(Campaign).where(Campaign.bolna_execution_id == execution_id)
            result = await session.execute(stmt)
            campaign = result.scalars().first()
        
        if not campaign:
            logger.error(f"Campaign not found for execution {execution_id}")
            raise ValueError(f"Campaign not found for execution {execution_id}")
            
        # Update execution ID if it changed (e.g. if we found it by campaign_id but specific execution ID is new)
        if campaign.bolna_execution_id != execution_id:
            logger.info(f"Updating execution ID for campaign {campaign.id}: {campaign.bolna_execution_id} -> {execution_id}")
            campaign.bolna_execution_id = execution_id
            
        # LOGGING: Debug the payload before applying
        try:
             # Create safe summary excluding massive transcript
             debug_payload = {k:v for k,v in bolna_payload.items() if k != 'transcript' and k != 'raw_payload'}
             logger.info(f"Applying Bolna Data to Campaign {campaign.id}. Payload Summary: {debug_payload}")
        except:
             pass

        # Apply data updates with failsafe
        try:
            await self._apply_bolna_data_to_campaign(session, campaign, bolna_payload)
        except Exception as e:
            logger.error(f"CRITICAL: Failed to apply parsed Bolna data: {e}")
            # FALBACK: Ensure we AT LEAST save the raw data so we don't lose the call info
            if bolna_payload.get('raw_payload'):
                campaign.bolna_raw_data = bolna_payload.get('raw_payload')
            elif isinstance(bolna_payload, dict):
                campaign.bolna_raw_data = bolna_payload
            
            # Still update status to failed interpretation but completed call
            if bolna_payload.get('call_status') == 'completed':
                 campaign.status = "COMPLETED"
                 campaign.bolna_error_message = f"Data parsing error: {str(e)}"
        
        campaign.updated_at = datetime.utcnow()
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        logger.info(f"Campaign {campaign.id} updated from webhook. Status: {campaign.status}")
        return campaign

    async def sync_campaign_with_bolna(self, session: AsyncSession, campaign: Campaign) -> Campaign:
        """
        Actively fetch latest status from Bolna and update campaign.
        Useful when webhooks fail or are delayed.
        """
        if not campaign.bolna_execution_id:
            return campaign
            
        if campaign.status in ["COMPLETED", "FAILED"]:
            return campaign
            
        try:
            from app.services.intelligence.bolna_service import bolna_service
            
            # Fetch latest data from Bolna
            bolna_data = await bolna_service.get_execution_details(campaign.bolna_execution_id)
            
            # Use the same 'parsed' structure as webhook if possible, 
            # but bolna_service.get_execution_details returns raw API response.
            # We should wrap it in parse_webhook_payload to normalize it
            normalized_data = bolna_service.parse_webhook_payload(bolna_data)
            
            # Check if status has changed significantly or if we have new data
            current_status = campaign.status
            
            await self._apply_bolna_data_to_campaign(session, campaign, normalized_data)
            
            if campaign.status != current_status:
                logger.info(f"Campaign {campaign.id} sync updated status: {current_status} -> {campaign.status}")
                campaign.updated_at = datetime.utcnow()
                session.add(campaign)
                await session.commit()
                await session.refresh(campaign)
                
        except Exception as e:
            logger.error(f"Failed to sync campaign {campaign.id} with Bolna: {e}")
            # Don't fail the request, just log and return current state
            
        return campaign

    async def sync_campaign_background(self, campaign_id: UUID):
        """
        Background task wrapper for sync_campaign_with_bolna.
        Creates a new session since the request session will be closed.
        """
        from app.core.db import get_session
        
        logger.info(f"Starting background sync for campaign {campaign_id}")
        
        # Manually manage session for background task
        session_gen = get_session()
        session = await session_gen.__anext__()
        
        try:
            campaign = await session.get(Campaign, campaign_id)
            if not campaign:
                logger.warning(f"Background sync: Campaign {campaign_id} not found")
                return
                
            await self.sync_campaign_with_bolna(session, campaign)
            
        except Exception as e:
            logger.error(f"Background sync failed for campaign {campaign_id}: {e}")
        finally:
            await session.close()

    async def _apply_bolna_data_to_campaign(self, session: AsyncSession, campaign: Campaign, bolna_payload: dict):
        """
        Helper to apply Bolna payload data to campaign model.
        Also creates or updates CampaignGoalDetail.
        """
        extracted_data = bolna_payload.get("extracted_data", {})
        
        # Determine duration
        duration = bolna_payload.get("conversation_duration", 0)
        
        # Generate campaign name using Gemini only if not already set or generic
        if not campaign.name or campaign.name == "Campaign Planning Call" or campaign.status == "INITIATED":
             campaign_name = await self.generate_campaign_name(extracted_data)
             campaign.name = campaign_name
        
        campaign.bolna_agent_id = bolna_payload.get("agent_id")
        campaign.bolna_call_status = bolna_payload.get("call_status")
        campaign.bolna_conversation_time = int(float(duration)) if duration else 0
        campaign.bolna_total_cost = float(bolna_payload.get("total_cost") or 0.0)
        # Only overwrite error message if present
        if bolna_payload.get("error_message"):
            campaign.bolna_error_message = bolna_payload.get("error_message")
            
        campaign.bolna_transcript = bolna_payload.get("transcript")
        campaign.bolna_extracted_data = extracted_data
        
        # Populate decision_context from extracted_data so it's not empty
        campaign.decision_context = extracted_data
        
        campaign.bolna_telephony_data = bolna_payload.get("telephony_data", {})
        campaign.bolna_raw_data = bolna_payload # Store full raw payload
        
        # Calculate Quality Score & Gap
        # Note: We now calculate it here for real calls too, using the same logic as simulation
        score, gap = self._calculate_quality_score(extracted_data)
        campaign.quality_score = score
        campaign.quality_gap = gap
        
        # Parse timestamps
        if bolna_payload.get("created_at"):
            try:
                campaign.bolna_created_at = datetime.fromisoformat(
                    bolna_payload["created_at"].replace("Z", "+00:00")
                )
            except Exception as e:
                logger.warning(f"Failed to parse created_at: {e}")
        
        if bolna_payload.get("updated_at"):
            try:
                campaign.bolna_updated_at = datetime.fromisoformat(
                    bolna_payload["updated_at"].replace("Z", "+00:00")
                )
            except Exception as e:
                logger.warning(f"Failed to parse updated_at: {e}")
        
         # Update team member info in User profile from extracted_data
        if extracted_data:
            from app.models.user import User
            user_stmt = select(User).where(User.id == campaign.user_id)
            user_res = await session.execute(user_stmt)
            user_db = user_res.scalars().first()
            
            if user_db:
                team_member = extracted_data.get("team_member", {})
                if team_member.get("role"):
                    user_db.designation = team_member.get("role")
                if team_member.get("department"):
                    user_db.team = team_member.get("department")
                session.add(user_db)
                logger.info(f"Updated user profile from extracted data for {user_db.id}")
        
        # Update status based on call status
        bolna_status = str(bolna_payload.get("call_status", "")).lower()
    
        if bolna_status == "completed":
            # Check for "Fake Completion" (Voicemail/No Answer/Empty)
            transcript = bolna_payload.get("transcript", "")
            # Ensure extracted_data is a dict
            if not isinstance(extracted_data, dict):
                 extracted_data = {}
                 
            is_empty_data = not extracted_data or not extracted_data.get("campaign_overview")
            is_short_transcript = len(str(transcript)) < 50
            
            if is_empty_data and is_short_transcript:
                logger.warning(f"Campaign {campaign.id} completed but looks like voicemail/empty. Marking as FAILED.")
                campaign.status = "FAILED"
                campaign.bolna_error_message = "Call completed but insufficient data (likely voicemail/no-answer)."
                campaign.bolna_call_status = "no-answer-detected" # Override for tracking
            else:
                campaign.status = "COMPLETED"
        elif bolna_status in ["failed", "no-answer", "busy"]:
            campaign.status = "FAILED"
        elif bolna_status in ["ringing", "call_initiated"]:
            campaign.status = "RINGING"
        else:
            # Default fallback for other statuses (e.g. speaking, listening, processing)
            # Only set to IN_PROGRESS if we are not already in a final state
            if campaign.status not in ["COMPLETED", "FAILED"]:
                campaign.status = "IN_PROGRESS"
                
        # --- Update/Create CampaignGoalDetail ---
        await self._upsert_campaign_goal_detail(session, campaign, bolna_payload)

    async def update_campaign_extracted_data(
        self,
        session: AsyncSession,
        campaign_id: UUID,
        new_extracted_data: dict
    ) -> Campaign:
        """
        Updates the extracted data for a campaign across all storage locations.
        Re-calculates quality score based on the new data.
        """
        # 1. Get Campaign
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
            
        # 2. Update Campaign Model Fields
        campaign.bolna_extracted_data = new_extracted_data
        
        # Update raw data if present
        if campaign.bolna_raw_data:
             # Create a deep copy or new dict to ensure SQLAlchemy detects change
             new_raw = dict(campaign.bolna_raw_data)
             new_raw["extracted_data"] = new_extracted_data
             campaign.bolna_raw_data = new_raw
             
        # Update legacy decision context
        campaign.decision_context = new_extracted_data
             
        # 3. Re-calculate Score
        score, gap = self._calculate_quality_score(new_extracted_data)
        campaign.quality_score = score
        campaign.quality_gap = gap
        
        # 4. Update CampaignGoalDetail
        from app.models.campaign_goal_detail import CampaignGoalDetail
        stmt = select(CampaignGoalDetail).where(CampaignGoalDetail.campaign_id == campaign.id)
        result = await session.execute(stmt)
        # There might be multiple details if multiple runs, we update all or just the latest?
        # Typically one active detail per campaign usually, or we update all matching the campaign.
        # Let's update all associated details to be safe, or filtered by execution_id if we had it.
        # Since this is a manual override, updating all linked details for this campaign seems appropriate 
        # as they represent the "Campaign's" outcome.
        details = result.scalars().all()
        
        for detail in details:
            detail.extracted_data = new_extracted_data
            if detail.raw_data:
                new_detail_raw = dict(detail.raw_data)
                new_detail_raw["extracted_data"] = new_extracted_data
                detail.raw_data = new_detail_raw
            session.add(detail)
            
        campaign.updated_at = datetime.utcnow()
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        logger.info(f"Updated extracted data for campaign {campaign.id}")
        return campaign

    async def _upsert_campaign_goal_detail(self, session: AsyncSession, campaign: Campaign, payload: dict):
        """
        Creates or updates the detailed analytics record.
        """
        from app.models.campaign_goal_detail import CampaignGoalDetail
        
        # Try to find existing record by execution_id
        stmt = select(CampaignGoalDetail).where(
            CampaignGoalDetail.campaign_id == campaign.id,
            CampaignGoalDetail.bolna_execution_id == payload.get("id")
        )
        result = await session.execute(stmt)
        detail = result.scalars().first()
        
        if not detail:
            # Create new
            detail = CampaignGoalDetail(
                campaign_id=campaign.id,
                bolna_execution_id=payload.get("id"),
                agent_id=payload.get("agent_id"),
                created_at=datetime.utcnow(), # Placeholder, updated below
                updated_at=datetime.utcnow(),
                status=payload.get("status", "unknown")
            )
        
        # Map fields
        def parse_dt(dt_str):
            if not dt_str: return None
            try:
                return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            except:
                return None
                
        detail.batch_id = payload.get("batch_id")
        detail.created_at = parse_dt(payload.get("created_at")) or datetime.utcnow()
        detail.updated_at = parse_dt(payload.get("updated_at")) or datetime.utcnow()
        detail.scheduled_at = parse_dt(payload.get("scheduled_at"))
        detail.answered_by_voice_mail = payload.get("answered_by_voice_mail")
        detail.conversation_duration = float(payload.get("conversation_duration") or 0.0)
        detail.total_cost = float(payload.get("total_cost") or 0.0)
        detail.transcript = payload.get("transcript")
        detail.usage_breakdown = payload.get("usage_breakdown")
        detail.cost_breakdown = payload.get("cost_breakdown")
        detail.extracted_data = payload.get("extracted_data")
        detail.summary = payload.get("summary")
        detail.error_message = payload.get("error_message")
        detail.status = payload.get("status") or payload.get("call_status") or "unknown"
        detail.agent_extraction = payload.get("agent_extraction")
        
        # Handle stringified JSON for agent_extraction
        start_agent_extr = payload.get("agent_extraction")
        if isinstance(start_agent_extr, str):
             try:
                detail.agent_extraction = json.loads(start_agent_extr)
             except:
                detail.agent_extraction = {"raw": start_agent_extr}
        else:
             detail.agent_extraction = start_agent_extr
             
        detail.workflow_retries = payload.get("workflow_retries")
        detail.rescheduled_at = parse_dt(payload.get("rescheduled_at"))
        detail.custom_extractions = payload.get("custom_extractions")
        detail.smart_status = payload.get("smart_status")
        detail.user_number = payload.get("user_number")
        detail.agent_number = payload.get("agent_number")
        detail.initiated_at = parse_dt(payload.get("initiated_at"))
        detail.deleted = payload.get("deleted", False)
        detail.retry_config = payload.get("retry_config")
        detail.retry_count = payload.get("retry_count", 0)
        detail.retry_history = payload.get("retry_history")
        detail.telephony_data = payload.get("telephony_data")
        detail.transfer_call_data = payload.get("transfer_call_data")
        detail.context_details = payload.get("context_details")
        detail.batch_run_details = payload.get("batch_run_details")
        detail.provider = payload.get("provider")
        detail.latency_data = payload.get("latency_data")
        
        # New field: raw_data
        detail.raw_data = payload
        
        session.add(detail)
        # Note: commit happens in caller
    async def generate_campaign_name(self, extracted_data: dict) -> str:
        """
        Generate a concise campaign name (4-5 words) using Gemini based on extracted data.
        
        Args:
            extracted_data: Extracted data from Bolna call
            
        Returns:
            Generated campaign name
        """
        if not extracted_data or not extracted_data.get("campaign_overview"):
            return "Campaign Planning Call"
        
        campaign_overview = extracted_data.get("campaign_overview", {})
        primary_goal = campaign_overview.get("primary_goal", "")
        goal_type = campaign_overview.get("goal_type", "")
        
        if not primary_goal:
            return "Campaign Planning Call"
        
        prompt = f"""
        You are a campaign naming expert.
        
        Based on this campaign information, generate a concise campaign name (maximum 4-5 words).
        
        Primary Goal: {primary_goal}
        Goal Type: {goal_type}
        
        Requirements:
        - Maximum 4-5 words
        - Clear and descriptive
        - Professional tone
        - Focus on the main objective
        
        Examples:
        - "Churn Reduction Research"
        - "New Feature Validation"
        - "Pricing Feedback Campaign"
        - "Onboarding Experience Study"
        
        Return ONLY the campaign name, nothing else.
        """
        
        try:
            name = await llm_service._generate(prompt, model_type="flash")
            # Clean up any quotes or extra whitespace
            name = name.strip().strip('"').strip("'")
            
            # Ensure it's not too long (max 60 chars)
            if len(name) > 60:
                name = name[:57] + "..."
            
            logger.info(f"Generated campaign name: {name}")
            return name
        except Exception as e:
            logger.error(f"Failed to generate campaign name: {e}")
            return "Campaign Planning Call"

    async def generate_brand_context(self, session: AsyncSession, company_id: UUID) -> str:
        """
        Generate a 2-line brand description using Gemini based on company profile.
        Includes caching to prevent repeated slow LLM calls.
        """
        import time

        from app.models.company import Company
        
        # 1. Check Cache first
        cache_key = f"brand_context_{company_id}"
        from app.services.intelligence.llm_service import llm_service
        if cached := llm_service._get_from_cache(cache_key):
            logger.info(f"Returning cached brand context for {company_id}")
            return cached

        start_time = time.time()
        # Fetch company and its brands
        from sqlalchemy.future import select

        from app.models.company import Brand
        
        # We fetch them separately or together
        company = await session.get(Company, company_id)
        if not company:
            return ""

        # Check if brand_context is already saved in company
        if company.brand_context:
            logger.info(f"Returning pre-saved brand context for company {company_id}")
            return company.brand_context

        stmt = select(Brand).where(Brand.company_id == company_id)
        result = await session.execute(stmt)
        brands = result.scalars().all()
        brand_names = [b.name for b in brands]
        
        # Define primary brand name for logging/fallback
        brand_name = company.brand_name
        
        # Restore variables needed for fallback
        industry = company.industry or "Retail/E-commerce"
        tagline = company.tagline or ""
        tags = ", ".join(company.tags or [])
        
        # Prepare Known Facts (excluding tagline as requested)
        legal_name = company.legal_name or brand_name
        hq_city = company.hq_city or "your city"
        
        prompt = f"""
        You are a brand strategist.

        Task: Write a single, objective "Functional Description" sentence for the brand below, using the provided facts.

        Known Facts:
        - Brand: {brand_name}
        - Legal Name: {legal_name}
        - Category: {industry}
        - Keywords: {tags}
        - HQ Location: {hq_city}

        Structure:
        "[Brand] is a [Category/Type] based in [City] best known for [Key Offering/Keywords], built for [Value Proposition]."

        Hard constraints:
        - Output exactly 1 sentence.
        - Use 3rd person objective tone (e.g. "Faasos is...", NOT "We are...").
        - NO marketing fluff or "team" persona.
        - Focus on utility and function.
        - Output ONLY the final sentence.

        Input:
        Brand Name: {brand_name}
        """
        
        try:
            # We use 'flash' for speed, grounded by the facts above
            logger.info(f"Generating brand context for {brand_name}...")
            context = await llm_service._generate(prompt, model_type="flash")
            
            # Clean up
            context = context.strip()
            
            # Cache it for 24h as brand profile changes slowly
            llm_service._set_cache(cache_key, context, ttl=86400)
            
            # Auto-save generated context to Company so we don't regenerate
            try:
                company.brand_context = context
                session.add(company)
                await session.commit()
                # logger.info(f"Auto-saved generated brand context to Company {company.id}")
            except Exception as e:
                logger.warning(f"Failed to auto-save generated brand context: {e}")
            
            duration = time.time() - start_time
            logger.info(f"Brand context generated and cached in {duration:.2f}s")
            return context
        except Exception as e:
            logger.error(f"Failed to generate brand context: {e}")
            
            # Structured Fallback (Functional)
            fallback = f"{brand_name} is a {industry.lower()} brand based in {hq_city}, known for {tags or 'quality services'}."
            return fallback

    async def get_context_suggestions(self, session: AsyncSession, campaign_id: UUID, user_id: str) -> dict:
        """
        Get default suggestions for campaign context fields.
        Optimized with asyncio.gather for speed.
        """
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")
            
        import asyncio

        from app.models.user import User

        # Run brand context and user fetch in parallel
        brand_context_task = self.generate_brand_context(session, campaign.company_id)
        user_task = session.get(User, user_id)
        
        brand_context, user = await asyncio.gather(brand_context_task, user_task)
        
        team_member_context = ""
        if user:
            name = user.full_name or "a team member"
            designation = user.designation or "representative"
            team = user.team or "Customer Experience"
            # Use campaign name safely
            clean_campaign_name = "SquareUp"
            if campaign.name and '-' in campaign.name:
                clean_campaign_name = campaign.name.split('-')[0].strip()
            
            team_member_context = f"Hi, I'm {name}, {designation} from the {team} team at {clean_campaign_name}."

        return {
            "brand_context": brand_context,
            "team_member_context": team_member_context
        }

    async def get_campaign_cohorts(self, session: AsyncSession, campaign_id: UUID) -> Dict[str, Any]:
        """
        Fetch unique cohorts and their lead counts from campaign leads.
        """
        from sqlalchemy import func

        from app.models.campaign_lead import CampaignLead
        
        # Get counts per cohort
        stmt = select(CampaignLead.cohort, func.count(CampaignLead.id)).where(
            CampaignLead.campaign_id == campaign_id,
            CampaignLead.cohort != None
        ).group_by(CampaignLead.cohort)
        
        result = await session.execute(stmt)
        rows = result.all()
        
        cohorts = [r[0] for r in rows if r[0]]
        counts = {r[0]: r[1] for r in rows if r[0]}

        # Fetch campaign to get selected cohorts
        campaign = await session.get(Campaign, campaign_id)
        selected = campaign.selected_cohorts if campaign and campaign.selected_cohorts is not None else []
        
        return {
            "cohorts": cohorts,
            "cohort_counts": counts,
            "selected_cohorts": selected
        }

    async def export_calendar_block(self, session: AsyncSession, campaign_id: UUID) -> str:
        """
        Generate .ics file content for campaign execution windows.
        """
        campaign = await session.get(Campaign, campaign_id)
        if not campaign or not campaign.execution_windows:
            return ""

        # ICS Format Header
        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Unclutr//Campaign Execution//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH"
        ]

        day_map = {
            'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
            'Friday': 4, 'Saturday': 5, 'Sunday': 6
        }
        today = datetime.now().date()

        for i, window in enumerate(campaign.execution_windows):
            day_name = window.get("day")
            start_time_str = window.get("start")
            end_time_str = window.get("end")
            
            if not start_time_str or not end_time_str:
                continue

            try:
                if day_name in day_map:
                    # New format: {day, start, end}
                    target_weekday = day_map[day_name]
                    days_ahead = target_weekday - today.weekday()
                    if days_ahead < 0:
                        days_ahead += 7
                    event_date = today + timedelta(days=days_ahead)
                    
                    start_h, start_m = map(int, start_time_str.split(':'))
                    end_h, end_m = map(int, end_time_str.split(':'))
                    
                    from datetime import time as dt_time
                    start_dt = datetime.combine(event_date, dt_time(hour=start_h, minute=start_m))
                    end_dt = datetime.combine(event_date, dt_time(hour=end_h, minute=end_m))
                else:
                    # Fallback/Legacy format: ISO strings
                    start_dt = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
                    end_dt = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
                
                start_ics = start_dt.strftime("%Y%m%dT%H%M%SZ")
                end_ics = end_dt.strftime("%Y%m%dT%H%M%SZ")
                
                ics_lines.extend([
                    "BEGIN:VEVENT",
                    f"UID:{campaign.id}-{i}@unclutr.ai",
                    f"DTSTAMP:{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}",
                    f"DTSTART:{start_ics}",
                    f"DTEND:{end_ics}",
                    f"SUMMARY:Campaign Execution: {campaign.name}",
                    f"DESCRIPTION:Execution window for campaign: {campaign.name}. Expecting customer calls.",
                    "STATUS:CONFIRMED",
                    "END:VEVENT"
                ])
            except Exception as e:
                logger.error(f"Failed to parse window for ICS: {e}")
                continue

        ics_lines.append("END:VCALENDAR")
        return "\n".join(ics_lines)

    async def delete_campaign(self, session: AsyncSession, campaign_id: UUID, company_id: UUID) -> bool:
        """
        Deletes a campaign and moves its leads to the archive.
        
        Args:
            session: AsyncSession
            campaign_id: Campaign UUID
            company_id: Company UUID (for security validation)
            
        Returns:
            True if deleted, False if not found
        """
        logger.info(f"Attempting to delete campaign {campaign_id} for company {company_id}")
        
        # 1. Fetch Campaign (verify ownership)
        campaign = await session.get(Campaign, campaign_id)
        
        if not campaign:
            logger.warning(f"Campaign {campaign_id} not found in DB.")
            return False
            
        logger.info(f"Campaign Found. Owner: {campaign.user_id}, Company: {campaign.company_id}")
        if str(campaign.company_id) != str(company_id): # Convert to string for safe comparison
            logger.warning(f"Access denied. Campaign Company={campaign.company_id} vs Request Company={company_id}")
            return False
            
        # [NEW] Check for existing calls before allowing deletion
        # "only drafts are allowed to delete or campaigns with no calls so far are allowed to delete"
        if campaign.status != "DRAFT":
            from app.models.call_log import CallLog
            from sqlalchemy import func
            
            # Count call logs
            stmt_calls = select(func.count(CallLog.id)).where(CallLog.campaign_id == campaign_id)
            calls_count = (await session.execute(stmt_calls)).scalar() or 0
            
            if calls_count > 0:
                logger.warning(f"Blocked deletion of campaign {campaign_id}: Status={campaign.status}, Calls={calls_count}")
                # Raise explicit error instead of returning False (which becomes 404)
                raise ValueError("Cannot delete a campaign that has call history. Please archive it instead.")
            
        try:
            # 2. Fetch Goal Details for archiving
            stmt_goals = select(CampaignGoalDetail).where(CampaignGoalDetail.campaign_id == campaign_id)
            result_goals = await session.execute(stmt_goals)
            goals = result_goals.scalars().all()
            
            await self._archive_and_delete_campaign(session, campaign, goals, campaign_id)
            
            logger.info(f"Successfully deleted campaign {campaign_id} (RAW SQL)")
            logger.info("Commit successful (RAW SQL)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete campaign {campaign_id}: {e}")
            logger.error(f"Exception during delete: {e}")
            await session.rollback()
            raise

    async def archive_campaign(self, session: AsyncSession, campaign_id: UUID, company_id: UUID) -> bool:
        """
        Explicitly archives a campaign (allowing those with calls).
        """
        campaign = await session.get(Campaign, campaign_id)
        
        if not campaign:
            logger.warning(f"Campaign {campaign_id} NOT FOUND in DB.")
            return False
            
        if str(campaign.company_id) != str(company_id):
            logger.warning(f"Access denied. Campaign Company={campaign.company_id} vs Request Company={company_id}")
            return False

        try:
             # Fetch Goal Details for archiving
            stmt_goals = select(CampaignGoalDetail).where(CampaignGoalDetail.campaign_id == campaign_id)
            result_goals = await session.execute(stmt_goals)
            goals = result_goals.scalars().all()

            await self._archive_and_delete_campaign(session, campaign, goals, campaign_id)
            return True
        except Exception as e:
             logger.error(f"Failed to archive campaign {campaign_id}: {e}")
             await session.rollback()
             raise

    async def _archive_and_delete_campaign(self, session: AsyncSession, campaign: Campaign, goals: List[CampaignGoalDetail], campaign_id: UUID):
        """
        Helper to archive and then delete a campaign.
        """
        def json_serial(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            if isinstance(obj, UUID):
                return str(obj)
            return str(obj)

        goals_data = json.loads(json.dumps([goal.dict() for goal in goals], default=json_serial))
        
        # 3. Archive Campaign
        archived_campaign = ArchivedCampaign(
            original_campaign_id=campaign.id,
            company_id=campaign.company_id,
            user_id=campaign.user_id,
            name=campaign.name,
            status=campaign.status,
            decision_context=campaign.decision_context,
            quality_score=campaign.quality_score,
            quality_gap=campaign.quality_gap,
            brand_context=campaign.brand_context,
            customer_context=campaign.customer_context,
            team_member_context=campaign.team_member_context,
            preliminary_questions=campaign.preliminary_questions,
            question_bank=campaign.question_bank,
            incentive_bank=campaign.incentive_bank,
            cohort_questions=campaign.cohort_questions,
            cohort_incentives=campaign.cohort_incentives,
            incentive=campaign.incentive,
            total_call_target=campaign.total_call_target,
            call_duration=campaign.call_duration,
            cohort_config=campaign.cohort_config,
            selected_cohorts=campaign.selected_cohorts,
            execution_windows=campaign.execution_windows,
            cohort_data=campaign.cohort_data,
            goal_details=goals_data,
            original_created_at=campaign.created_at,
            original_updated_at=campaign.updated_at
        )
        session.add(archived_campaign)

        # 4. Archive Leads
        stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        result = await session.execute(stmt)
        leads = result.scalars().all()
        
        logger.info(f"Found {len(leads)} leads to archive")
        
        if leads:
            archived_leads = [
                ArchivedCampaignLead(
                    original_campaign_id=campaign_id,
                    campaign_name=campaign.name,
                    customer_name=lead.customer_name,
                    contact_number=lead.contact_number,
                    cohort=lead.cohort,
                    meta_data=lead.meta_data,
                    created_at=lead.created_at
                )
                for lead in leads
            ]
            session.add_all(archived_leads)
            
        # Use raw SQL to ensure deletion bypasses any ORM complexity
        logger.info("Executing RAW SQL DELETE for related records")
        
        # 1. Delete execution maps (references queue_items)
        await session.execute(
            text("DELETE FROM bolna_execution_maps WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )

        # [FIX] Delete User Call Logs (references user_queue_items)
        await session.execute(
            text("DELETE FROM user_call_logs WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )

        # [FIX] Delete User Queue Items (references queue_items)
        await session.execute(
            text("DELETE FROM user_queue_items WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )

        # 2. Delete call logs (references leads & campaigns & queue_items[optional])
        # Moved up to avoid FK constraint with queue_items
        await session.execute(
            text("DELETE FROM call_logs WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )

        # 2b. Delete call raw data
        await session.execute(
            text("DELETE FROM call_raw_data WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )

        # 3. Delete queue items (references leads)
        await session.execute(
            text("DELETE FROM queue_items WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )

        # 3c. Delete campaign events
        await session.execute(
            text("DELETE FROM campaign_events WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )

        # 4. Delete leads
        logger.info("Executing RAW SQL DELETE for Leads")
        await session.execute(
            text("DELETE FROM campaign_leads WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )
        
        # 4. Delete Goal Details
        logger.info("Executing RAW SQL DELETE for Goal Details")
        await session.execute(
            text("DELETE FROM campaigns_goals_details WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )
        
        # 5. Delete from cohorts
        await session.execute(
            text("DELETE FROM cohorts WHERE campaign_id = :campaign_id"),
            {"campaign_id": campaign_id}
        )

        # 6. Delete the Campaign itself
        logger.info("Executing RAW SQL DELETE for Campaign")
        result = await session.execute(
            text("DELETE FROM campaigns WHERE id = :campaign_id"),
            {"campaign_id": campaign_id}
        )
        logger.info(f"DELETE campaigns rowcount: {result.rowcount}")
        
        await session.commit()
        
        # 7. Verify Deletion
        # Create new session/transaction or use same? Accessing 'campaign' might re-fetch?
        # session is expired on commit usually.
        check_campaign = await session.get(Campaign, campaign_id)
        if check_campaign:
                logger.error(f"Campaign {campaign_id} STILL EXISTS after commit!")
        else:
                logger.info("Verified - Campaign is gone.")
    
    async def simulate_intake_call(self, session: AsyncSession, company_id: UUID, user_id: str) -> Campaign:
        """
        Orchestrates the full simulation flow (LEGACY - for backward compatibility).
        1. Create Interview Session
        2. Generate Mock Transcript (Bolna)
        3. Extract Data (LLM)
        4. Score Quality
        5. Create Campaign
        """
        logger.info(f"Starting intake simulation for company {company_id}")
        
        # 1. Create Interview Session & 2. Get Mock Transcript
        # In a real scenario, these would be separate steps (Start -> Webhook Completion)
        # For simulation, we do it atomically.
        interview_session = await mock_bolna_service.create_session(session, company_id, user_id)
        
        # Simulate the call happening and getting a transcript
        transcript = mock_bolna_service.generate_mock_transcript()
        interview_session.transcript = transcript
        interview_session.status = "COMPLETED"
        session.add(interview_session)
        await session.commit() # Save transcript before extraction
        
        # 3. Extract Data
        extracted_data = await llm_service.extract_campaign_context(transcript)
        
        # 4. Score Quality
        score, gap = self._calculate_quality_score(extracted_data)
        
        # 5. Create Campaign
        campaign = Campaign(
            company_id=company_id,
            user_id=user_id,
            name=f"Research: {extracted_data.get('decision_1', 'New Campaign')[:30]}...",
            status="DRAFT", # Always starts as draft for review
            decision_context=extracted_data,
            quality_score=score,
            quality_gap=gap,
            interview_session_id=interview_session.id
        )
        
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        return campaign

    def _calculate_quality_score(self, data: dict) -> (int, str):
        """
        Calculates a 0-5 score based on the 'Winning Flow' criteria.
        Returns (score, gap_reason).
        """
        score = 0
        gaps = []
        
        # Helper to safely get nested keys
        def get_nested(d, *keys):
            for key in keys:
                if isinstance(d, dict):
                    d = d.get(key)
                else:
                    return None
            return d

        # 1. Decision Clarity (Problem/Goal)
        # Old: decision_1
        # New: campaign_overview.primary_goal
        goal = get_nested(data, "campaign_overview", "primary_goal")
        if goal and len(goal) > 10:
            score += 1
        else:
            gaps.append("Goal is vague")
            
        # 2. Metric Specificity
        # Old: success_metric_1
        # New: execution_details.success_criteria
        metric = get_nested(data, "execution_details", "success_criteria")
        if metric and len(metric) > 5:
            score += 1
        else:
            gaps.append("Success criteria undefined")
            
        # 3. Deadline / Timeline
        # Old: decision_1_deadline
        # New: campaign_constraints.timeline
        timeline = get_nested(data, "campaign_constraints", "timeline")
        if timeline and timeline.lower() not in ["not specified", "none", ""]:
            score += 1
        else:
            gaps.append("No timeline set")
            
        # 4. Cohorts / Audience
        # Old: target_cohorts
        # New: target_customers.primary_segments OR just equality check if it's a list
        # The sample data didn't show target_customers clearly in the dump, checking 'target_customers' from sample output
        # Sample had "target_customers": ["Repeat", "Churned"] directly?
        # Let's check root level first, then nested.
        cohorts = data.get("target_customers")
        if not cohorts:
             # Try nested
             cohorts = get_nested(data, "target_customers", "primary_segments")
             
        if cohorts and isinstance(cohorts, list) and len(cohorts) > 0:
            score += 1
        else:
            gaps.append("Target audience undefined")
            
        # 5. Tradeoff / Evidence / Dependency
        # Old: evidence_needed / tradeoff_focus
        # New: execution_details.decision_dependency OR execution_details.related_initiative
        dependency = get_nested(data, "execution_details", "decision_dependency")
        if dependency:
            score += 1
        else:
            gaps.append("Decision dependency/Evidence missing")
            
        return score, ", ".join(gaps) if gaps else None

    async def sync_campaign_to_calendar(self, session: AsyncSession, campaign_id: UUID) -> int:
        """
        Sync campaign execution windows to the user's Google Calendar.
        """
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")
        
        logger.info(f"[SYNC] Fetched campaign {campaign_id} from DB")
        logger.info(f"[SYNC] execution_windows type: {type(campaign.execution_windows)}")
        logger.info(f"[SYNC] execution_windows value: {campaign.execution_windows}")
        logger.info(f"[SYNC] execution_windows length: {len(campaign.execution_windows or [])}")

        # Find the calendar connection for this company
        from app.models.calendar_connection import CalendarConnection
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == campaign.company_id,
            CalendarConnection.provider == "google",
            CalendarConnection.status == "active"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()

        if not conn:
            logger.error(f"No active Google Calendar connection found for company {campaign.company_id}")
            raise ValueError("No active Google Calendar connection found")

        logger.info(f"Syncing campaign {campaign_id} to calendar. Windows found: {len(campaign.execution_windows or [])}")
        logger.debug(f"Execution windows: {campaign.execution_windows}")

        # Fetch company for timezone info
        from app.models.company import Company
        company = await session.get(Company, campaign.company_id)
        timezone_str = company.timezone if company else "UTC"

        from app.services.intelligence.google_calendar_service import (
            google_calendar_service,
        )
        events_created = await google_calendar_service.sync_campaign_windows(conn, campaign, timezone_str=timezone_str)
        
        logger.info(f"Successfully created {events_created} events for campaign {campaign_id}")
        return events_created

    async def replace_campaign_leads(
        self,
        session: AsyncSession,
        campaign_id: UUID,
        leads_data: List[dict]
    ) -> bool:
        """
        Replaces leads in a campaign while preserving those already called.
        Handles cohort updates for existing leads.
        """
        from sqlalchemy import insert, select

        from app.models.archived_campaign_lead import ArchivedCampaignLead
        from app.models.bolna_execution_map import BolnaExecutionMap
        from app.models.call_log import CallLog
        from app.models.queue_item import QueueItem
        
        logger.info(f"Refined lead replacement for campaign {campaign_id}. New input count: {len(leads_data)}")
        
        # Get all leads for this campaign
        stmt_leads = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        result_leads = await session.execute(stmt_leads)
        existing_leads = result_leads.scalars().all()
        
        # Get IDs of leads that have call logs
        stmt_called = select(CallLog.lead_id).where(CallLog.campaign_id == campaign_id)
        result_called = await session.execute(stmt_called)
        called_lead_ids = set(result_called.scalars().all())
        
        # Split leads into called (preserved) and uncalled (removable)
        called_leads = [l for l in existing_leads if l.id in called_lead_ids]
        uncalled_lead_ids = [l.id for l in existing_leads if l.id not in called_lead_ids]
        
        logger.info(f"Found {len(called_leads)} called leads (preserved) and {len(uncalled_lead_ids)} uncalled leads (to be removed)")

        # 2. Archiving and Deletion of uncalled data
        if uncalled_lead_ids:
            # Fetch uncalled leads for archiving
            stmt_uncalled = select(CampaignLead).where(CampaignLead.id.in_(uncalled_lead_ids))
            result_uncalled = await session.execute(stmt_uncalled)
            uncalled_leads_rows = result_uncalled.scalars().all()
            
            if uncalled_leads_rows:
                # Fetch campaign name for archiving
                stmt_camp = select(Campaign.name).where(Campaign.id == campaign_id)
                res_camp = await session.execute(stmt_camp)
                campaign_name = res_camp.scalar() or "Unknown Campaign"
                
                archived_leads = [
                    ArchivedCampaignLead(
                        original_campaign_id=campaign_id,
                        campaign_name=campaign_name,
                        customer_name=lead.customer_name,
                        contact_number=lead.contact_number,
                        cohort=lead.cohort,
                        meta_data=lead.meta_data,
                        created_at=lead.created_at
                    )
                    for lead in uncalled_leads_rows
                ]
                session.add_all(archived_leads)
                await session.flush() # Ensure archival is registered before deletion

            # Clean up related execution maps and queue items first
            # 1. Delete execution maps for uncalled leads (linked via QueueItem)
            # Find queue item IDs for these leads
            stmt_qi_ids = select(QueueItem.id).where(
                QueueItem.campaign_id == campaign_id,
                QueueItem.lead_id.in_(uncalled_lead_ids)
            )
            # Delete BolnaExecutionMap records referencing these QueueItems
            await session.execute(
                delete(BolnaExecutionMap).where(
                    BolnaExecutionMap.queue_item_id.in_(stmt_qi_ids)
                )
            )

            # 2. Delete queue items for uncalled leads
            await session.execute(
                delete(QueueItem).where(
                    QueueItem.campaign_id == campaign_id,
                    QueueItem.lead_id.in_(uncalled_lead_ids)
                )
            )
            
            # 3. Delete uncalled leads themselves
            await session.execute(
                delete(CampaignLead).where(CampaignLead.id.in_(uncalled_lead_ids))
            )
        
        # Note: We do NOT delete Goal Details (Analytics) here anymore because some might belong to called leads.
        # However, we might want to clear them for UNCALLED leads if they exist? Typically goal_details are linked to calls.
        # Let's keep them for now to avoid complexity unless user asks.

        # 3. Reconciliation and Insertion
        # Key for preservation: (contact_number, cohort)
        called_map = {(l.contact_number, l.cohort): l for l in called_leads}
        
        final_leads_to_insert = []
        counts = {"inserted": 0, "skipped": 0, "cohort_updates": 0}
        
        for lead_dict in leads_data:
            number = lead_dict.get("contact_number")
            new_cohort = lead_dict.get("cohort") or "Default"
            
            # Check if this exact number/cohort combo was already called
            if (number, new_cohort) in called_map:
                # Exact skip - historical record exists
                counts["skipped"] += 1
                continue
            
            # Check if the number exists in DIFFERENT cohorts that were called
            # (If so, we still insert this as a NEW lead for the NEW cohort, 
            # as per user's "allow cohort updates" vs "preserve if called as part of old cohort" logic)
            # Actually, the user said "preserve the cohort as well if before updating that user has been called as a part of old cohort"
            # This means: 
            # - Old Cohort A (called) -> STAYS.
            # - New CSV has Cohort B -> ADDED as new record.
            
            # Ensure required fields
            lead_dict["campaign_id"] = campaign_id
            if "id" not in lead_dict:
                lead_dict["id"] = uuid4()
            if "created_at" not in lead_dict:
                lead_dict["created_at"] = datetime.utcnow()
            if "status" not in lead_dict:
                lead_dict["status"] = "PENDING"
                
            final_leads_to_insert.append(lead_dict)
            counts["inserted"] += 1

        # 4. Perform Insertion
        if final_leads_to_insert:
            stmt = insert(CampaignLead).values(final_leads_to_insert)
            await session.execute(stmt)
            
        # 5. Clear strategy state on the campaign (DRAFT refinement)
        # We only do this if we actually modified leads to force re-planning
        if uncalled_lead_ids or final_leads_to_insert:
            stmt_campaign = select(Campaign).where(Campaign.id == campaign_id)
            result_campaign = await session.execute(stmt_campaign)
            campaign = result_campaign.scalars().first()
            
            if campaign:
                # Reset campaign to DRAFT status to require re-initialization
                campaign.status = "DRAFT"
                campaign.preliminary_questions = []
                campaign.cohort_questions = {}
                campaign.cohort_incentives = {}
                campaign.incentive = None
                campaign.cohort_config = {}
                campaign.selected_cohorts = []
                campaign.cohort_data = {}
                campaign.updated_at = datetime.utcnow()
                
                # Update specific leads timestamp in metadata
                meta = dict(campaign.meta_data or {})
                meta["leads_updated_at"] = datetime.utcnow().isoformat() + "Z"
                campaign.meta_data = meta
                
                session.add(campaign)
                logger.info(f"Campaign {campaign_id} status reset to DRAFT after lead replacement")

        await session.commit()
        logger.info(f"Lead replacement complete: {counts}")
        return True

campaign_service = CampaignService()
