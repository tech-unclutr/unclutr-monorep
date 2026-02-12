"""
User Queue Warmer Service

Handles promotion of yes-intent leads from AI queue to user queue,
priority calculation, and queue rebalancing.
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_, or_, func, desc
from app.services.intelligence.llm_service import llm_service
from app.models.queue_item import QueueItem
from app.models.user_queue_item import UserQueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign_lead import CampaignLead
import logging

logger = logging.getLogger(__name__)


from app.models.campaign_event import CampaignEvent
from app.services.websocket_manager import manager
from app.models.campaign import Campaign
from app.core.intelligence_utils import enrich_user_intent


class UserQueueWarmer:
    """Service for managing the user action queue."""
    
    MAX_USER_QUEUE_SIZE = 4
    RESUME_USER_QUEUE_SIZE = 3
    
    @staticmethod
    async def promote_to_user_queue(
        session: AsyncSession,
        queue_item_id: UUID,
        manual_override: bool = False
    ) -> Optional[UserQueueItem]:
        """
        Promote a yes-intent lead from AI queue to user queue.
        
        Args:
            session: Database session
            queue_item_id: ID of the queue item with yes-intent
            
        Returns:
            Created UserQueueItem or None if already promoted
        """
        try:
            # Get the queue item with row locking to prevent race conditions
            queue_item_result = await session.execute(
                select(QueueItem).where(QueueItem.id == queue_item_id).with_for_update()
            )
            queue_item = queue_item_result.scalar_one_or_none()
            
            if not queue_item:
                logger.warning(f"Queue item {queue_item_id} not found")
                return None
            
            # Check if already promoted
            if queue_item.promoted_to_user_queue:
                logger.info(f"Queue item {queue_item_id} already promoted")
                return None

            # [FIX] Check if a UserQueueItem already exists for this lead (Race Condition Guard)
            # Even if promoted_to_user_queue is False (in race), checking the table ensures uniqueness.
            existing_uqi_result = await session.execute(
                select(UserQueueItem).where(
                    and_(
                        UserQueueItem.lead_id == queue_item.lead_id,
                        UserQueueItem.campaign_id == queue_item.campaign_id,
                        UserQueueItem.status != "CLOSED"
                    )
                )
            )
            existing_uqi = existing_uqi_result.scalars().first()
            
            if existing_uqi:
                logger.info(f"UserQueueItem already exists for lead {queue_item.lead_id} (ID: {existing_uqi.id})")
                
                # [FIX] Update history even if already in queue
                # This ensures the dashboard doesn't show stale "AI CALL X hours ago" value
                # when a fresh AI attempt has happened.
                
                # Get the latest BolnaExecutionMap to update the context
                bolna_result = await session.execute(
                    select(BolnaExecutionMap).where(
                        BolnaExecutionMap.queue_item_id == queue_item_id
                    ).order_by(desc(BolnaExecutionMap.created_at)).limit(1)
                )
                bolna_map = bolna_result.scalar_one_or_none()
                
                if bolna_map:
                    new_history_entry = {
                        "bolna_call_id": bolna_map.bolna_call_id,
                        "call_duration": bolna_map.call_duration,
                        "call_status": bolna_map.call_status,
                        "extracted_data": bolna_map.extracted_data or {},
                        "transcript_summary": bolna_map.transcript_summary,
                        "created_at": bolna_map.created_at.isoformat() if bolna_map.created_at else None
                    }
                    
                    # Update call_history (handle list vs dict migration)
                    current_history = existing_uqi.call_history
                    if isinstance(current_history, list):
                        existing_uqi.call_history = current_history + [new_history_entry]
                    elif isinstance(current_history, dict) and current_history:
                        existing_uqi.call_history = [current_history, new_history_entry]
                    else:
                        existing_uqi.call_history = [new_history_entry]
                    
                    # Also update summary and intent if we have better info
                    # We re-run the summary/context extraction to be safe
                    found_transcript = bolna_map.transcript or bolna_map.full_transcript
                    if found_transcript:
                         try:
                             # Generate structured context and concise summary
                             existing_uqi.ai_summary = await llm_service.generate_concise_summary(str(found_transcript))
                             existing_uqi.structured_context = await llm_service.generate_structured_lead_context(
                                 transcript=str(found_transcript),
                                 extracted_data=bolna_map.extracted_data or {}
                             )
                         except:
                             pass
                    
                    # Update priority indicators
                    extracted = bolna_map.extracted_data or {}
                    if extracted.get("interested"):
                        existing_uqi.intent_strength = max(existing_uqi.intent_strength, 0.9)
                    
                    callback_time = extracted.get("callback_time")
                    if callback_time:
                        try:
                            existing_uqi.confirmation_slot = datetime.fromisoformat(callback_time.replace('Z', '+00:00'))
                        except:
                            pass

                # Mark ORIGINAL queue item as promoted to stop redundant promotes
                queue_item.promoted_to_user_queue = True
                queue_item.promoted_at = datetime.utcnow()
                session.add(queue_item)
                
                existing_uqi.updated_at = datetime.utcnow()
                session.add(existing_uqi)
                await session.commit()
                return existing_uqi
            
            # Get the lead
            lead_result = await session.execute(
                select(CampaignLead).where(CampaignLead.id == queue_item.lead_id)
            )
            lead = lead_result.scalar_one_or_none()
            
            if not lead:
                logger.warning(f"Lead {queue_item.lead_id} not found")
                return None
            
            # Get AI call history from BolnaExecutionMap
            bolna_result = await session.execute(
                select(BolnaExecutionMap).where(
                    BolnaExecutionMap.queue_item_id == queue_item_id
                ).order_by(desc(BolnaExecutionMap.created_at)).limit(1)
            )
            bolna_map = bolna_result.scalar_one_or_none()
            
            # Extract AI context
            call_history = {}
            ai_summary = "Lead expressed interest"
            structured_context = None  # [NEW] Structured insights
            intent_strength = 0.8  # Default
            confirmation_slot = None
            
            if manual_override:
                ai_summary = "Manually selected for contact"
                intent_strength = 1.0 # Treat as high intent to ensure visibility

            
            if bolna_map:
                extracted_data = bolna_map.extracted_data or {}
                
                # Build call history
                call_history = {
                    "bolna_call_id": bolna_map.bolna_call_id,
                    "call_duration": bolna_map.call_duration,
                    "call_status": bolna_map.call_status,
                    "extracted_data": extracted_data,
                    "transcript_summary": bolna_map.transcript_summary,
                    "created_at": bolna_map.created_at.isoformat() if bolna_map.created_at else None
                }
                
                # Extract intent strength
                if extracted_data.get("interested"):
                    intent_strength = 0.9
                    
                # Extract callback time
                callback_time = extracted_data.get("callback_time")
                if callback_time:
                    try:
                        # Parse callback time (format may vary)
                        confirmation_slot = datetime.fromisoformat(callback_time.replace('Z', '+00:00'))
                    except Exception as e:
                        logger.warning(f"Could not parse callback_time: {callback_time}, error: {e}")
                
                # Generate AI summary and structured context
                found_transcript = bolna_map.transcript or bolna_map.full_transcript
                
                if found_transcript:
                     # [NEW] Generate structured context for rich UI display
                     try:
                         structured_context = await llm_service.generate_structured_lead_context(
                             transcript=str(found_transcript),
                             extracted_data=extracted_data
                         )
                         logger.info(f"Generated structured context for lead {queue_item.lead_id}")
                     except Exception as e:
                         logger.warning(f"Failed to generate structured context: {e}")
                         structured_context = None
                     
                     # Use LLM for concise summary (backwards compatibility)
                     ai_summary = await llm_service.generate_concise_summary(str(found_transcript))
                     
                     # [IMPROVED] Fallback to Bolna's native summary if Gemini returns generic text
                     if (not ai_summary or "found by AI" in ai_summary.lower()) and bolna_map.transcript_summary:
                         logger.info(f"Generic LLM summary detected, falling back to Bolna native summary for lead {queue_item.lead_id}")
                         ai_summary = bolna_map.transcript_summary[:200]
                elif bolna_map.transcript_summary:
                    # Take first 200 chars as summary
                    ai_summary = bolna_map.transcript_summary[:200]
                elif extracted_data.get("interested"):
                    ai_summary = "Lead confirmed interest and wants to proceed"
            
            # Calculate initial priority
            priority_score = UserQueueWarmer._calculate_priority_score(
                confirmation_slot=confirmation_slot,
                intent_strength=intent_strength,
                retry_count=0,
                manual_priority_boost=0
            )
            
            # Create user queue item
            user_queue_item = UserQueueItem(
                campaign_id=queue_item.campaign_id,
                lead_id=queue_item.lead_id,
                original_queue_item_id=queue_item.id,
                call_history=call_history,
                ai_summary=ai_summary,
                structured_context=structured_context,  # [NEW]
                intent_strength=intent_strength,
                confirmation_slot=confirmation_slot,
                detected_at=datetime.utcnow(),
                priority_score=priority_score,
                status="READY"
            )
            
            session.add(user_queue_item)
            
            # Mark original queue item as promoted
            queue_item.promoted_to_user_queue = True
            queue_item.promoted_at = datetime.utcnow()
            session.add(queue_item)
            
            await session.commit()
            await session.refresh(user_queue_item)
            
            logger.info(
                f"Promoted queue item {queue_item_id} to user queue "
                f"(priority: {priority_score}, intent: {intent_strength})"
            )
            
            # Check for backpressure after promotion
            await UserQueueWarmer.check_backpressure(session, queue_item.campaign_id)
            
            return user_queue_item
            
        except Exception as e:
            logger.error(f"Error promoting queue item {queue_item_id}: {e}")
            await session.rollback()
            raise
    
    @staticmethod
    def _calculate_priority_score(
        confirmation_slot: Optional[datetime],
        intent_strength: float,
        retry_count: int,
        manual_priority_boost: int = 0,
        detected_at: Optional[datetime] = None
    ) -> int:
        """
        Calculate priority score for a user queue item.
        
        Priority Levels:
        - 10000+: Super priority (committed time within -30min to +60min)
        - 8000+: Urgent priority (committed time past due)
        - 5000+: High priority (committed time within 2 hours)
        - 2000-5000: Intent strength boost
        - 0-1000: Time decay (fresher = higher)
        - Penalty: -100 per retry
        
        Args:
            confirmation_slot: When customer committed to callback
            intent_strength: 0.0 to 1.0
            retry_count: Number of retry attempts
            detected_at: When yes-intent was detected
            
        Returns:
            Priority score (higher = more urgent)
        """
        score = 0
        now = datetime.utcnow()
        
        # 1. Committed Time Boost (HIGHEST PRIORITY)
        if confirmation_slot:
            time_diff = (confirmation_slot - now).total_seconds() / 60  # minutes
            
            if -30 <= time_diff <= 60:
                # Within window: -30min to +60min
                score += 10000
            elif time_diff < -30:
                # Past due: increasingly urgent
                minutes_overdue = abs(time_diff + 30)
                score += 8000 + min(2000, int(minutes_overdue * 10))
            elif time_diff <= 120:
                # Within 2 hours
                score += 5000
            elif time_diff <= 240:
                # Within 4 hours
                score += 3000
        
        # 2. Intent Strength Boost (0-2000 points)
        score += int(intent_strength * 2000)
        
        # 3. Time Decay (fresher = higher, 0-1000 points)
        if detected_at:
            age_minutes = (now - detected_at).total_seconds() / 60
            # Decay over 24 hours
            decay_factor = max(0, 1 - (age_minutes / 1440))
            score += int(decay_factor * 1000)
        else:
            # If no detected_at, assume fresh
            score += 1000
        
        # 4. Retry Penalty (-100 per retry)
        score -= (retry_count * 100)
        
        # 5. Manual Priority Boost
        score += manual_priority_boost
        
        return max(0, score)
    
    @staticmethod
    async def rebalance_queue(
        session: AsyncSession,
        campaign_id: UUID
    ) -> int:
        """
        Recalculate priority for all READY items in user queue.
        
        Args:
            session: Database session
            campaign_id: Campaign ID
            
        Returns:
            Number of items rebalanced
        """
        try:
            # Get all READY items
            result = await session.execute(
                select(UserQueueItem).where(
                    and_(
                        UserQueueItem.campaign_id == campaign_id,
                        UserQueueItem.status == "READY"
                    )
                )
            )
            items = result.scalars().all()
            
            if not items:
                return 0
            
            updated_count = 0
            for item in items:
                new_priority = UserQueueWarmer._calculate_priority_score(
                    confirmation_slot=item.confirmation_slot,
                    intent_strength=item.intent_strength,
                    retry_count=item.retry_count,
                    manual_priority_boost=item.manual_priority_boost,
                    detected_at=item.detected_at
                )
                
                if item.priority_score != new_priority:
                    item.priority_score = new_priority
                    item.updated_at = datetime.utcnow()
                    session.add(item)
                    updated_count += 1
            
            if updated_count > 0:
                await session.commit()
                logger.info(f"Rebalanced {updated_count} user queue items for campaign {campaign_id}")
            
            return updated_count
            
        except Exception as e:
            logger.error(f"Error rebalancing user queue for campaign {campaign_id}: {e}")
            await session.rollback()
            return 0
    
    @staticmethod
    async def unlock_stale_locks(
        session: AsyncSession,
        campaign_id: UUID,
        timeout_minutes: int = 15
    ) -> int:
        """
        Unlock items that have been locked for too long.
        
        Args:
            session: Database session
            campaign_id: Campaign ID
            timeout_minutes: Lock timeout in minutes
            
        Returns:
            Number of items unlocked
        """
        try:
            cutoff = datetime.utcnow() - timedelta(minutes=timeout_minutes)
            
            result = await session.execute(
                select(UserQueueItem).where(
                    and_(
                        UserQueueItem.campaign_id == campaign_id,
                        UserQueueItem.status == "LOCKED",
                        UserQueueItem.locked_at < cutoff
                    )
                )
            )
            stale_items = result.scalars().all()
            
            if not stale_items:
                return 0
            
            for item in stale_items:
                item.status = "READY"
                item.locked_by_user_id = None
                item.locked_at = None
                item.lock_expires_at = None
                item.updated_at = datetime.utcnow()
                session.add(item)
            
            await session.commit()
            
            logger.info(f"Unlocked {len(stale_items)} stale user queue items")
            return len(stale_items)
            
        except Exception as e:
            logger.error(f"Error unlocking stale items: {e}")
            await session.rollback()
            return 0
    
    @staticmethod
    async def get_next_lead(
        session: AsyncSession,
        campaign_id: UUID,
        user_id: str
    ) -> Optional[UserQueueItem]:
        """
        Get and lock the next highest priority lead for a user.
        
        Args:
            session: Database session
            campaign_id: Campaign ID
            user_id: User ID (Firebase UID)
            
        Returns:
            Locked UserQueueItem or None if queue is empty
        """
        try:
            # Find highest priority READY item
            # [FIX] Respect retry cooldowns or future scheduled times
            now = datetime.utcnow()
            result = await session.execute(
                select(UserQueueItem).where(
                    and_(
                        UserQueueItem.campaign_id == campaign_id,
                        UserQueueItem.status == "READY",
                        or_(
                            UserQueueItem.retry_scheduled_for.is_(None),
                            UserQueueItem.retry_scheduled_for <= now
                        )
                    )
                ).order_by(
                    UserQueueItem.priority_score.desc(),
                    UserQueueItem.detected_at.asc()
                ).limit(1)
            )
            item = result.scalar_one_or_none()
            

            if not item:
                # [FALLBACK] Check for raw QueueItems (Open Leads)
                # If the user is asking for a lead and none are in the User Queue, 
                # we grab from the AI/Open Queue.
                raw_result = await session.execute(
                    select(QueueItem).where(
                        and_(
                            QueueItem.campaign_id == campaign_id,
                            QueueItem.promoted_to_user_queue == False,
                            QueueItem.status.in_(["ELIGIBLE", "READY", "COMPLETED"])
                        )
                    ).limit(1)
                )
                raw_item = raw_result.scalar_one_or_none()
                
                if raw_item:
                    logger.info(f"Fallback: Auto-promoting raw lead {raw_item.lead_id} for user {user_id}")
                    item = await UserQueueWarmer.promote_to_user_queue(session, raw_item.id, manual_override=True)
                
                if not item:
                    return None
            
            # Lock for user (15 min timeout)
            item.status = "LOCKED"

            item.locked_by_user_id = user_id
            item.locked_at = datetime.utcnow()
            item.lock_expires_at = datetime.utcnow() + timedelta(minutes=15)
            item.updated_at = datetime.utcnow()
            
            session.add(item)
            await session.commit()
            await session.refresh(item)
            
            logger.info(f"Locked user queue item {item.id} for user {user_id}")
            
            logger.info(f"Locked user queue item {item.id} for user {user_id}")
            
            # Reset manual priority boost once locked/handled
            if item.manual_priority_boost > 0:
                item.manual_priority_boost = 0
                session.add(item)
                await session.commit()
            
            return item
            
        except Exception as e:
            logger.error(f"Error getting next lead: {e}")
            await session.rollback()
            return None

    @staticmethod
    async def check_backpressure(
        session: AsyncSession,
        campaign_id: UUID
    ) -> None:
        """
        Monitor user queue size and auto-pause/resume the AI campaign.
        
        Ceiling: 3 items -> Pause
        Floor: 2 items -> Resume
        """
        try:
            # Count active items (not CLOSED)
            result = await session.execute(
                select(func.count(UserQueueItem.id)).where(
                    and_(
                        UserQueueItem.campaign_id == campaign_id,
                        UserQueueItem.status != "CLOSED"
                    )
                )
            )
            active_count = result.scalar() or 0
            
            campaign = await session.get(Campaign, campaign_id)
            if not campaign:
                return

            # Backpressure Logic
            if active_count >= UserQueueWarmer.MAX_USER_QUEUE_SIZE and campaign.status == "ACTIVE":
                # AUTO-PAUSE
                campaign.status = "PAUSED"
                campaign.updated_at = datetime.utcnow()
                session.add(campaign)
                
                # Log System Event
                session.add(CampaignEvent(
                    campaign_id=campaign_id,
                    event_type="SYSTEM",
                    message=f"Backpressure: Queue hit {active_count} leads. Pausing AI agents.",
                    status="PAUSED"
                ))
                
                await session.commit()
                logger.info(f"Backpressure: Paused campaign {campaign_id} (count: {active_count})")
                
                # Broadcast update
                await manager.broadcast_status_update(str(campaign_id), {"event": "campaign_status_update", "status": "PAUSED"})

            elif active_count <= UserQueueWarmer.RESUME_USER_QUEUE_SIZE and campaign.status == "PAUSED":
                # AUTO-RESUME
                # [NOTE] We only auto-resume if it was paused by the system or is in a state where resuming is logical.
                # For now, we follow the user's direct instruction: "maintain at least 3 leads... start again"
                campaign.status = "ACTIVE"
                campaign.updated_at = datetime.utcnow()
                session.add(campaign)
                
                # Log System Event
                session.add(CampaignEvent(
                    campaign_id=campaign_id,
                    event_type="SYSTEM",
                    message=f"Backpressure: Queue dropped to {active_count}. Resuming AI agents.",
                    status="ACTIVE"
                ))
                
                await session.commit()
                logger.info(f"Backpressure: Resumed campaign {campaign_id} (count: {active_count})")
                
                # Broadcast update
                await manager.broadcast_status_update(str(campaign_id), {"event": "campaign_status_update", "status": "ACTIVE"})
                
        except Exception as e:
            logger.error(f"Error checking backpressure for campaign {campaign_id}: {e}")
            await session.rollback()

    @staticmethod
    async def poll_missed_promotions(
        session: AsyncSession,
        campaign_id: UUID
    ) -> int:
        """
        Sweep for leads that SHOULD be in user queue but aren't.
        Checks for:
        1. BolnaExecutionMap has interested=true
        2. QueueItem.promoted_to_user_queue is False
        3. Campaign matches
        """
        logger.debug(f"poll_missed_promotions called for {campaign_id}")
        try:
            # Join QueueItem -> BolnaExecutionMap
            # We want items that HAVE a bolna execution map indicating interest
            # BUT have NOT been promoted yet.
            
            # Note: We filter in Python for the JSON logic to be safe/simple, 
            # or we can try to do it in SQL if the dialect supports it.
            # For now, let's fetch candidates and filter.
            
            query = select(QueueItem, BolnaExecutionMap).join(
                BolnaExecutionMap, QueueItem.id == BolnaExecutionMap.queue_item_id
            ).where(
                and_(
                    QueueItem.campaign_id == campaign_id,
                    QueueItem.promoted_to_user_queue == False
                )
            )
            
            result = await session.execute(query)
            candidates = result.all()
            logger.debug(f"Found {len(candidates)} candidates for promotion check")
            
            promoted_count = 0
            
            for q_item, b_map in candidates:
                try:
                    # Check interest condition using robust agreement detection
                    is_interested = False
                    extracted = b_map.extracted_data or {}
                    
                    if not isinstance(extracted, dict):
                        logger.warning(f"Malformed extracted_data for BolnaMap {b_map.id}")
                        continue

                    # [FIX] Use shared agreement logic instead of just "interested" flag
                    # to match webhook behavior and dashboard fallback
                    from app.core.agreement_utils import detect_agreement_status
                    
                    # Extract transcript from BolnaExecutionMap
                    transcript_data = b_map.transcript or b_map.full_transcript or ""
                    transcript_str = ""
                    
                    if isinstance(transcript_data, list):
                        transcript_str = "\n".join([
                            f"{turn.get('role', 'unknown')}: {turn.get('content', '')}"
                            for turn in transcript_data
                        ])
                    elif isinstance(transcript_data, str):
                        transcript_str = transcript_data

                    # We need determined status - we can infer it or pass raw checks
                    # Since we don't have the exact determined status here easily without re-running logic,
                    # we rely on the extracted intent and the fact the call is essentially done/mapped.
                    # [FIX] Align with Dashboard Logic: execution.py uses enriched intent and NO transcript text
                    # This ensures that what the user sees as "OPEN" in Dashboard is exactly what gets promoted.
                    raw_intent = str(extracted.get("user_intent", ""))
                    call_outcome = b_map.call_outcome or b_map.call_status
                    
                    enriched_intent = enrich_user_intent(
                        raw_intent=raw_intent,
                        outcome=call_outcome,
                        duration=b_map.call_duration or 0,
                        transcript=transcript_str
                    )

                    agreement = detect_agreement_status(
                        user_intent=enriched_intent,
                        outcome=call_outcome,
                        extracted_data=extracted,
                        # transcript_text=transcript_str  <-- INTENTIONALLY OMITTED to match Dashboard logic
                    )
                    
                    # Promotion Condition: Agreed with High/Medium confidence OR explicit interested flag
                    if (agreement.get("agreed") and agreement.get("confidence") in ["high", "medium"]) or extracted.get("interested") is True:
                        is_interested = True
                    
                    if is_interested:
                        # Promote it!
                        logger.info(f"Polling found missed promotion: Lead {q_item.lead_id} (Agreement: {agreement})")
                        await UserQueueWarmer.promote_to_user_queue(session, q_item.id)
                        promoted_count += 1
                except Exception as e:
                    logger.error(f"Error processing candidate promotion for Log {b_map.id}: {e}")
                    continue
            
            return promoted_count
            
        except Exception as e:
            logger.error(f"Error polling missed promotions for campaign {campaign_id}: {e}")
            return 0
