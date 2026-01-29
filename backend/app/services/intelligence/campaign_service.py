import logging
import re
import json
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.future import select

from app.models.campaign import Campaign
from app.models.interview import InterviewSession
from app.services.intelligence.mock_bolna_service import mock_bolna_service
from app.services.intelligence.llm_service import llm_service

logger = logging.getLogger(__name__)

class CampaignService:
    async def create_initial_campaign(
        self,
        session: Session,
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
            status="INITIATED",
            phone_number=phone_number
        )
        
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
        logger.info(f"Initial campaign {campaign.id} created and committed. User: {user_id}")
        return campaign
        
    async def update_campaign_execution_id(
        self,
        session: Session,
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
        session: Session,
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

    async def sync_campaign_with_bolna(self, session: Session, campaign: Campaign) -> Campaign:
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

    async def _apply_bolna_data_to_campaign(self, session: Session, campaign: Campaign, bolna_payload: dict):
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
        campaign.bolna_conversation_time = int(duration) if duration else 0
        campaign.bolna_total_cost = bolna_payload.get("total_cost")
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
        
        # Extract team member info from extracted_data
        if extracted_data:
            team_member = extracted_data.get("team_member", {})
            campaign.team_member_role = team_member.get("role")
            campaign.team_member_department = team_member.get("department")
        
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
        session: Session,
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

    async def _upsert_campaign_goal_detail(self, session: Session, campaign: Campaign, payload: dict):
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
    
    async def simulate_intake_call(self, session: Session, company_id: UUID, user_id: str) -> Campaign:
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

campaign_service = CampaignService()
