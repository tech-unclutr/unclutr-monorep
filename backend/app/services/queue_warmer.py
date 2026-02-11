from datetime import datetime, timedelta
from typing import Dict, Optional
from uuid import UUID
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import and_, func, or_, select

from app.core.lead_utils import normalize_phone_number
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.cohort import Cohort
from app.models.queue_item import QueueItem
from app.services.bolna_caller import BolnaCaller

logger = logging.getLogger(__name__)


class QueueWarmer:
    
    @staticmethod
    async def clear_ready_buffer(session: AsyncSession, campaign_id: UUID):
        """
        Clears the 'buffer' of READY items so that we can pick fresh leads from the backlog.
        This is useful on 'Resume' to ensure we prioritize based on the absolute latest state
        rather than processing stale items that were queued hours ago.
        """
        try:
            # Delete only READY items (orphaned waiting items)
            stmt = (
                select(QueueItem)
                .where(QueueItem.campaign_id == campaign_id)
                .where(QueueItem.status == "READY")
            )
            result = await session.execute(stmt)
            items = result.scalars().all()
            
            if not items:
                return
                
            item_ids = [item.id for item in items]
            
            # [FIX] Delete associated BolnaExecutionMap records first to avoid ForeignKeyViolationError
            # Although READY items shouldn't have maps, this provides a safety layer for stale/resumed state.
            from sqlalchemy import delete
            from app.models.user_queue_item import UserQueueItem
            
            # 1. Identify which items are referenced by UserQueueItems (PROTECTED)
            protected_stmt = select(UserQueueItem.original_queue_item_id).where(
                UserQueueItem.original_queue_item_id.in_(item_ids)
            )
            protected_result = await session.execute(protected_stmt)
            protected_ids = set(protected_result.scalars().all())
            
            # 2. Filter out protected items
            items_to_delete = [item for item in items if item.id not in protected_ids]
            ids_to_delete = [item.id for item in items_to_delete]
            
            if not ids_to_delete:
                logger.info(f"[QueueWarmer] All {len(items)} READY items are protected by UserQueue. Skipping cleanup.")
                return

            # 3. Delete Execution Maps for the items we ARE deleting
            await session.execute(
                delete(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id.in_(ids_to_delete))
            )
                
            logger.info(f"[QueueWarmer] Clearing {len(items_to_delete)} READY items (Protected: {len(protected_ids)})...")
            for item in items_to_delete:
                await session.delete(item)
                
            # Flush to ensure deletions happen before we try to create new ones
            await session.flush()
        except Exception as e:
            logger.error(f"[QueueWarmer] Error clearing buffer: {e}")

    @staticmethod
    async def check_and_replenish(campaign_id: UUID, session: AsyncSession):
        """
        Main Loop: Determines who goes from READY -> ACTIVE, and Backlog -> READY.
        """
        # 1. Fetch Campaign & Config with Locking to prevent concurrent runs
        stmt = select(Campaign).where(Campaign.id == campaign_id).with_for_update()
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if not campaign:
            return
            
        config = campaign.execution_config or {}
        
        
        # 0. Status Check - Skip if COMPLETED
        if campaign.status == "COMPLETED":
            logger.info(f"[QueueWarmer] Campaign {campaign_id} is COMPLETED. Skipping replenishment.")
            return
        
        # Standby Check: We allow replenishment (Backlog -> READY) in PAUSED state,
        # but only allow promotion (READY -> ACTIVE) in ACTIVE/IN_PROGRESS states.


        # --- STAGE 0: WAKE UP SCHEDULED CALLS ---
        await QueueWarmer._wake_scheduled_items(session, campaign)

        # --- STAGE 0.5: CLEANUP STALE ITEMS (Fix Deadlocks) ---
        await QueueWarmer._cleanup_stale_items(session, campaign)

        # --- STAGE 2: PROMOTION (READY -> ACTIVE) ---
        # Traffic Cop: Respect Max Concurrency
        MAX_CONCURRENCY = config.get("max_concurrent_calls", 2) 
        
        # Stage 0.2: Wake up PENDING items (recovery)
        await QueueWarmer._wake_pending_items(session, campaign)
        
        # --- STAGE 1: REPLENISHMENT (BACKLOG -> READY) ---
        # Ensure Upcoming Queue has enough people BEFORE promotion
        # User Request: Waitlist to Rest ratio = 1:3 -> Total Buffer = 4 * MAX_CONCURRENCY
        TARGET_BUFFER = max(5, MAX_CONCURRENCY * 4)
        
        buffer_count_result = await session.execute(
            select(func.count(QueueItem.id))
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status == "READY")
        )
        current_buffer = buffer_count_result.one()[0]
        
        needed = TARGET_BUFFER - current_buffer
        
        if needed > 0:
            logger.info(f"[QueueWarmer] Buffer needs replenishment. Needed: {needed}")
            await QueueWarmer._replenish_buffer_strategy(session, campaign, needed)
            # Flush replenishment so promotion can see the new items within the same transaction
            await session.flush()
        else:
            logger.info(f"[QueueWarmer] Buffer full. Current: {current_buffer}, Target: {TARGET_BUFFER}")
        
        active_count_result = await session.execute(
            select(func.count(QueueItem.id))
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status == "DIALING_INTENT")
        )
        active_count = active_count_result.one()[0]
        
        slots_available = MAX_CONCURRENCY - active_count
        
        if slots_available > 0 and campaign.status in ["ACTIVE", "IN_PROGRESS"]:
            await QueueWarmer._promote_buffer(session, campaign, slots_available)
            
        try:
            # Final Commit for the entire transaction block
            await session.commit()
            logger.info(f"[QueueWarmer] Successfully committed replenishment for campaign {campaign_id}")
            
            # --- STAGE 3: COMPLETION CHECK ---
            await QueueWarmer._check_completion(session, campaign)
            
        except Exception as commit_err:
            import traceback
            error_msg = f"[QueueWarmer] COMMIT FAILED: {str(commit_err)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            with open("critical_error.log", "a") as f:
                f.write(f"\n[{datetime.utcnow()}] {error_msg}\n")
            await session.rollback()

    @staticmethod
    async def _cleanup_stale_items(session: AsyncSession, campaign: Campaign):
        """
        Detects items stuck in DIALING_INTENT for too long (> 5 mins) and fails them.
        This prevents 'ghost' calls from consuming concurrency slots forever.
        """
        try:
            stale_cutoff = datetime.utcnow() - timedelta(minutes=5)
            
            stmt = (
                select(QueueItem)
                .where(QueueItem.campaign_id == campaign.id)
                .where(QueueItem.status == "DIALING_INTENT")
                .where(QueueItem.updated_at < stale_cutoff)
            )
            result = await session.execute(stmt)
            stale_items = result.scalars().all()
            
            if not stale_items:
                return

            logger.info(f"[QueueWarmer] Found {len(stale_items)} stale DIALING_INTENT items. Cleaning up...")
            
            for item in stale_items:
                logger.info(f"[QueueWarmer] Failing stale item {item.id} (Lead {item.lead_id})")
                item.status = "FAILED"
                item.outcome = "System Timeout (Stale)"
                # Allow retry if rules permit
                if item.execution_count < 2:
                     # Reset for retry instead of hard fail
                     item.status = "READY"
                     item.outcome = "Retry Pending (Timeout)"
                     item.priority_score += 50 # Boost priority for retry
                
                item.updated_at = datetime.utcnow() # [FIX] Refresh timestamp
                session.add(item)
            
            await session.flush()    
        except Exception as e:
            logger.error(f"[QueueWarmer] Error cleaning stale items: {e}")

    @staticmethod
    async def _get_busy_phone_numbers(session: AsyncSession, campaign_id: UUID) -> set:
        """
        Returns a set of normalized phone numbers that are currently actively being called.
        """
        # Timeouts for stale calls (matching execution.py)
        initiated_cutoff = datetime.utcnow() - timedelta(minutes=5)
        active_cutoff = datetime.utcnow() - timedelta(minutes=30)

        # Query active execution maps and dialing intent items
        statement = (
            select(CampaignLead.contact_number)
            .join(QueueItem, CampaignLead.id == QueueItem.lead_id)
            .outerjoin(BolnaExecutionMap, QueueItem.id == BolnaExecutionMap.queue_item_id)
            .where(QueueItem.campaign_id == campaign_id)
            .where(
                or_(
                    QueueItem.status == "DIALING_INTENT",
                    and_(
                        func.lower(BolnaExecutionMap.call_status).in_(["initiated", "ringing", "connected", "speaking", "listening", "processing", "in-progress"]),
                        or_(
                            and_(
                                func.lower(BolnaExecutionMap.call_status) == "initiated",
                                BolnaExecutionMap.updated_at > initiated_cutoff
                            ),
                            and_(
                                func.lower(BolnaExecutionMap.call_status).in_(["ringing", "connected", "speaking", "listening", "processing", "in-progress"]),
                                BolnaExecutionMap.updated_at > active_cutoff
                            )
                        )
                    )
                )
            )
        )
        
        result = await session.execute(statement)
        numbers = result.scalars().all()
        return {normalize_phone_number(n) for n in numbers if n}

    @staticmethod
    async def _promote_buffer(session: AsyncSession, campaign: Campaign, slots: int):
        """
        Moves top priority items from READY -> DIALING_INTENT and triggers calls.
        Deduplicates by phone number to prevent parallel calls to the same person.
        """
        # 1. Get currently busy phone numbers
        busy_numbers = await QueueWarmer._get_busy_phone_numbers(session, campaign.id)
        
        # 2. Pick top priority READY items (fetch more than slots to account for busy numbers)
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign.id)
            .where(QueueItem.status == "READY")
            # [FIX] Do not dial items that are already promoted to the User Queue
            .where(QueueItem.promoted_to_user_queue == False) 
            .order_by(QueueItem.priority_score.desc(), QueueItem.created_at.asc())
            .limit(slots * 5) # Fetch plenty of candidates
        )
        result = await session.execute(stmt)
        candidates = result.all()
        
        if not candidates:
            logger.info("[QueueWarmer] No candidates found for promotion. Buffer empty or no READY items.")
            return
            
        items_to_promote = []
        promoted_numbers = set()
        
        logger.info(f"[QueueWarmer] Found {len(candidates)} candidates. Inspecting...")

        for q_item, lead in candidates:
            if len(items_to_promote) >= slots:
                break
                
            norm_num = normalize_phone_number(lead.contact_number)
            if not norm_num:
                logger.warning(f"[QueueWarmer] Skipping lead {lead.id} - Invalid number.")
                continue # Safety
                
            # Skip if number is already busy or already in this promotion batch
            if norm_num in busy_numbers or norm_num in promoted_numbers:
                logger.debug(f"[QueueWarmer] Skipping lead {lead.id} ({norm_num}) - Phone number is already busy.")
                continue
                
            # [HARD GUARDRAIL] Max 2 calls per session
            if q_item.execution_count >= 2:
                logger.warning(f"[QueueWarmer] HARD GUARDRAIL: Skipping lead {lead.id} - Max 2 calls reached. Marking FAILED.")
                q_item.status = "FAILED"
                q_item.outcome = "Max Retries Exceeded"
                session.add(q_item)
                continue
            
            logger.info(f"[QueueWarmer] Promoting lead {lead.id} (Count={q_item.execution_count} -> {q_item.execution_count + 1})")

                
            items_to_promote.append(q_item)
            promoted_numbers.add(norm_num)
            
        if not items_to_promote:
            # queue_warmer results
            return
            
        # Update status and collect IDs
        lead_ids = []
        queue_item_ids = []
        
        for item in items_to_promote:
            item.status = "DIALING_INTENT"
            item.execution_count += 1
            item.updated_at = datetime.utcnow() # [FIX] Refresh timestamp to avoid immediate stale cleanup
            session.add(item)
            lead_ids.append(item.lead_id)
            queue_item_ids.append(item.id)
            
        # [CRITICAL FIX] Commit the "Intent to Call" state BEFORE making the external side-effect (Bolna API call).
        # This ensures that even if the API call fails or the process crashes later, the system 
        # "remembers" it attempted the call, preventing an immediate retry (spam loop).
        await session.commit()
        
        # Refresh objects after commit to avoid DetachedInstanceError or stale data
        await session.refresh(campaign)
        for item in items_to_promote:
            await session.refresh(item)
        
        # [NEW] Broadcast the 'DIALING_INTENT' state immediately to the UI
        # This ensures the user sees "Dialing..." while the Bolna API request is in flight.
        try:
            from app.api.v1.endpoints.execution import (
                get_campaign_realtime_status_internal,
            )
            from app.services.websocket_manager import manager
            status_data = await get_campaign_realtime_status_internal(campaign.id, session, trigger_warmer=False)
            await manager.broadcast_status_update(str(campaign.id), status_data)
        except Exception as broadcast_err:
            logger.warning(f"[QueueWarmer] Early broadcast failed: {broadcast_err}")
        
        # Trigger Bolna
        logger.info(f"[QueueWarmer] Promoting {len(items_to_promote)} items to Active Dialing...")
        try:
            call_results = await BolnaCaller.create_and_schedule_batch(
                session=session,
                campaign_id=campaign.id, 
                lead_ids=lead_ids, 
                queue_item_ids=queue_item_ids
            )
            
            # Handle immediate errors
            if call_results and call_results.get("status") == "error":
                if call_results.get("error_type") == "WINDOW_EXPIRED":
                    logger.warning(f"[QueueWarmer] Window expired for campaign {campaign.id}. Pausing.")
                    campaign.status = "PAUSED"
                    meta = campaign.meta_data or {}
                    meta["window_expired"] = True
                    campaign.meta_data = meta
                    session.add(campaign)
                
                for item in items_to_promote:
                    item.status = "FAILED"
                    session.add(item)
                return

            if call_results and "results" in call_results:
                for i, res in enumerate(call_results["results"]):
                    if i < len(items_to_promote) and res.get("status") == "error":
                        items_to_promote[i].status = "FAILED"
                        items_to_promote[i].outcome = res.get("error") or "Unknown Error"
                        session.add(items_to_promote[i])
            
                # Broadcast the new state to the UI via WebSocket
                try:
                    from app.api.v1.endpoints.execution import (
                        get_campaign_realtime_status_internal,
                    )
                    from app.services.websocket_manager import manager
                    
                    # Fetch full state
                    status_data = await get_campaign_realtime_status_internal(campaign.id, session, trigger_warmer=False)
                    
                    # Broadcast
                    await manager.broadcast_status_update(str(campaign.id), status_data)
                    logger.info(f"[QueueWarmer] Broadcasted state update for campaign {campaign.id}")
                except Exception as broadcast_err:
                    logger.error(f"[QueueWarmer] Failed to broadcast state update: {broadcast_err}")
                    
        except Exception as e:
            import traceback
            error_msg = f"[QueueWarmer] CRITICAL PROMOTION FAILURE: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            with open("critical_error.log", "a") as f:
                f.write(f"\n[{datetime.utcnow()}] {error_msg}\n")
            
            for item in items_to_promote:
                item.status = "FAILED"
                item.outcome = f"Promotion Error: {str(e)[:100]}"
                session.add(item)
            await session.flush()


    @staticmethod
    async def _get_cohort_progress(session: AsyncSession, campaign_id: UUID) -> Dict[str, int]:
        """
        Returns the count of completed calls per cohort.
        Completed = INTENT_YES, INTENT_NO, CONSUMED, SCHEDULED (successful call attempts)
        """
        completed_statuses = ["INTENT_YES", "INTENT_NO", "CONSUMED", "SCHEDULED", "INTENT_YES_PENDING"]
        
        result = await session.execute(
            select(CampaignLead.cohort, func.count(QueueItem.id))
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status.in_(completed_statuses))
            .group_by(CampaignLead.cohort)
        )
        
        return dict(result.all())

    @staticmethod
    async def _get_cohort_outcomes(session: AsyncSession, campaign_id: UUID) -> Dict[str, int]:
        """
        Returns the count of successful outcomes per cohort (YES Intent).
        """
        outcome_statuses = ["INTENT_YES", "INTENT_YES_PENDING"]
        
        result = await session.execute(
            select(CampaignLead.cohort, func.count(QueueItem.id))
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status.in_(outcome_statuses))
            .group_by(CampaignLead.cohort)
        )
        
        return dict(result.all())

    @staticmethod
    async def _rebalance_buffer(session: AsyncSession, campaign_id: UUID, scores: Dict[str, float]):
        """
        [TRUE DYNAMIC REBALANCING]
        Updates priority_score of ALL items currently in READY status based on the latest
        adaptive scores. This ensures that if yield gaps change, the queue re-sorts IMMEDIATELY.
        """
        if not scores:
            return

        # Fetch all READY items (joined with CampaginLead to get cohort)
        # Note: We only touch READY items. SCHEDULED (999) are sacred.
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status == "READY")
        )
        result = await session.execute(stmt)
        items = result.all()
        
        updated_count = 0
        for q_item, lead in items:
            cohort_score = scores.get(lead.cohort, 0.0)
            
            # Base Priority: 0
            # Dynamic Boost: score * 100 (e.g. 0.5 -> 50)
            # This physically moves them ahead in the queue
            new_priority = int(cohort_score * 100)
            
            # [FIX] Skip rebalancing for High Priority items (e.g. Scheduled Wakeups = 999, Manual Promotes)
            # This prevents them from being downgraded back to cohort-based scores
            if q_item.priority_score >= 500:
                continue

            if q_item.priority_score != new_priority:
                q_item.priority_score = new_priority
                session.add(q_item)
                updated_count += 1
        
        if updated_count > 0:
            logger.info(f"[QueueWarmer] Rebalanced {updated_count} items in buffer based on latest yield gaps.")
            await session.flush()

    @staticmethod
    async def _replenish_buffer_strategy(session: AsyncSession, campaign: Campaign, count: int):
        """
        Selects best leads from Backlog -> READY based on Cohort Strategy.
        Excludes cohorts that have reached their target call count.
        
        INTELLIGENCE:
        1. Gap Analysis: Prioritize cohorts trailing behind their target share.
        2. Outcome Yield: Boost priority for cohorts with low 'YES' yield to reach outcome targets faster.
        3. Dynamic Rebalancing: Re-sorts the ENTIRE existing buffer to match new priorities.
        """
        # 1. Determine Target Cohort (Strategy)
        cohort_config = campaign.cohort_config or {} 
        selected_cohorts = campaign.selected_cohorts or []
        
        # Get progress telemetry
        cohort_progress = await QueueWarmer._get_cohort_progress(session, campaign.id)
        cohort_outcomes = await QueueWarmer._get_cohort_outcomes(session, campaign.id)
        
        # Filter out cohorts that have reached their target
        eligible_cohorts = {}
        for cohort_name, target_count in cohort_config.items():
            if selected_cohorts and cohort_name not in selected_cohorts:
                continue
            
            completed_count = cohort_progress.get(cohort_name, 0)
            if completed_count < target_count:
                eligible_cohorts[cohort_name] = target_count
            else:
                logger.info(f"[QueueWarmer] Cohort '{cohort_name}' reached target ({completed_count}/{target_count} completed)")
        
        # If no eligible cohorts, stop replenishment
        # BUT: Still perform rebalancing if we have a buffer!
        if not eligible_cohorts:
            # Check if we have buffer to rebalance anyway?
            # For now, if strategy is done, we might not need to rebalance, but let's be safe.
            logger.info(f"[QueueWarmer] All targets reached for campaign {campaign.id}. No replenishment. (Progress: {cohort_progress})")
            return
        
        logger.info(f"[QueueWarmer] Eligible cohorts for replenishment: {list(eligible_cohorts.keys())}")
        
        # Calculate current buffer composition
        buffer_counts_result = await session.execute(
            select(CampaignLead.cohort, func.count(QueueItem.id))
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign.id)
            .where(QueueItem.status == "READY")
            .group_by(CampaignLead.cohort)
        )
        buffer_counts = dict(buffer_counts_result.all())
        total_buffer = sum(buffer_counts.values())

        total_weight = sum(eligible_cohorts.values())
        total_outcomes = sum(cohort_outcomes.values())
        
        scores = {}
        for cohort_name, weight in eligible_cohorts.items():
            # A. Workload Gap (Target Share vs Buffer Share)
            target_share = weight / total_weight if total_weight > 0 else 0
            actual_share = buffer_counts.get(cohort_name, 0) / total_buffer if total_buffer > 0 else 0
            workload_gap = target_share - actual_share
            
            # B. Yield Gap (Boost if this cohort is trailing in 'YES' outcomes)
            # This ensures we dial MORE of the low-performing cohorts to catch up on outcome targets.
            target_outcome_share = target_share
            actual_outcome_share = cohort_outcomes.get(cohort_name, 0) / total_outcomes if total_outcomes > 0 else 0
            yield_gap = target_outcome_share - actual_outcome_share
            
            # Weighted Score (0.7 Workload + 0.3 Yield)
            scores[cohort_name] = (workload_gap * 0.7) + (max(0, yield_gap) * 0.3)
        
        # [TRUE DYNAMIC REBALANCING]
        # Immediately re-sort the existing buffer
        await QueueWarmer._rebalance_buffer(session, campaign.id, scores)

        target_cohort_name = None
        if scores:
            target_cohort_name = max(scores, key=scores.get)
            
        # 2. Fetch from Backlog -> READY
        if count > 0:
            await QueueWarmer._fetch_and_queue(session, campaign, target_cohort_name, count)

    @staticmethod
    async def _fetch_and_queue(session: AsyncSession, campaign: Campaign, cohort_name: Optional[str], count: int):
        """
        Moves Fresh leads -> READY status.
        """
        existing_q = select(QueueItem.lead_id).where(QueueItem.campaign_id == campaign.id)
        
        query = select(CampaignLead).where(CampaignLead.campaign_id == campaign.id)
        query = query.where(CampaignLead.id.not_in(existing_q))
        
        if cohort_name:
             query = query.where(CampaignLead.cohort == cohort_name)
        
        # Optimization: Sort by something? created_at?
        query = query.limit(count)
        logger.info(f"[QueueWarmer] Fetching up to {count} leads for cohort '{cohort_name}'...")
        
        candidates_result = await session.execute(query)
        candidates = candidates_result.scalars().all()
        
        if not candidates:
             if cohort_name:
                 # Fallback to any cohort if target is empty
                 await QueueWarmer._fetch_and_queue(session, campaign, None, count)
             return

        logger.info(f"[QueueWarmer] Queueing {len(candidates)} leads (Backlog -> READY)...")
        
        # Resolve cohort_id
        cohort_id = None
        if cohort_name:
             cohort_obj = (await session.execute(select(Cohort).where(Cohort.campaign_id == campaign.id, Cohort.name == cohort_name))).scalars().first()
             if cohort_obj: cohort_id = cohort_obj.id

        # CRITICAL FIX: Check for existing queue items before creating new ones
        # This prevents race conditions and duplicate entries
        for lead in candidates:
            # Double-check that this lead doesn't already have a queue item
            # (race condition protection)
            existing_check = await session.execute(
                select(QueueItem)
                .where(QueueItem.campaign_id == campaign.id)
                .where(QueueItem.lead_id == lead.id)
            )
            existing_item = existing_check.scalars().first()
            
            if existing_item:
                logger.info(f"[QueueWarmer] Skipping lead {lead.id} - already has queue item (status: {existing_item.status})")
                continue
            
            item = QueueItem(
                campaign_id=campaign.id,
                lead_id=lead.id,
                status="READY", # Staged for promotion
                cohort_id=cohort_id,
                priority_score=0 
            )
            session.add(item)
            
            
        await session.flush()

    @staticmethod
    async def _wake_scheduled_items(session: AsyncSession, campaign: Campaign):
        """
        Checks for SCHEDULED items that are due (scheduled_for <= Now).
        Promotes them to READY with High Priority.
        """
        # [FIX] Use UTC for consistency with storage
        now = datetime.utcnow()
        
        stmt = (
            select(QueueItem)
            .where(QueueItem.campaign_id == campaign.id)
            .where(QueueItem.status == "SCHEDULED")
            .where(QueueItem.scheduled_for <= now)
        )
        result = await session.execute(stmt)
        items = result.scalars().all()
        
        if not items:
            return

        logger.info(f"[QueueWarmer] Waking up {len(items)} scheduled calls...")
        
        for item in items:
            item.status = "READY"
            item.priority_score = 999 # Highest priority to ensure immediate pickup
            session.add(item)
            
        await session.flush()


    @staticmethod
    async def _wake_pending_items(session: AsyncSession, campaign: Campaign):
        """
        Checks for items stuck in PENDING status (usually from migration or data cleaning).
        Promotes them to READY so they can be processed.
        """
        stmt = (
            select(QueueItem)
            .where(QueueItem.campaign_id == campaign.id)
            .where(QueueItem.status == "PENDING")
        )
        result = await session.execute(stmt)
        items = result.scalars().all()
        
        if not items:
            return

        logger.info(f"[QueueWarmer] Recovering {len(items)} items from PENDING status...")
        
        for item in items:
            item.status = "READY"
            session.add(item)
            
            session.add(item)
            
        await session.flush()

    @staticmethod
    async def _check_completion(session: AsyncSession, campaign: Campaign):
        """
        Checks if the campaign is truly finished (Active=0 AND Backlog=0/Targets Met).
        If so, updates status to COMPLETED.
        """
        # Reload campaign to get latest status
        await session.refresh(campaign)
        if campaign.status == "COMPLETED":
            return

        # 1. Check Active Items (Anything that keeps the campaign alive)
        # READY: Waiting to be dialed
        # DIALING_INTENT: Currently dialing
        # SCHEDULED: Waiting for a future time
        # PENDING: Waiting for recovery
        active_statuses = ["READY", "DIALING_INTENT", "IN_PROGRESS", "SCHEDULED", "PENDING"]
        
        active_result = await session.execute(
            select(func.count(QueueItem.id))
            .where(QueueItem.campaign_id == campaign.id)
            .where(QueueItem.status.in_(active_statuses))
        )
        active_count = active_result.scalar()
        
        if active_count > 0:
            # Still working on items
            return

        # 2. Check Backlog / Targets
        # If we have no active items, we might still have a backlog.
        # But if we just ran replenishment (in check_and_replenish) and it found nothing,
        # active_count would remain 0.
        
        # Double check if any valid leads remain that satisfy the cohort config
        
        cohort_config = campaign.cohort_config or {}
        selected_cohorts = campaign.selected_cohorts or []
        
        # Get count of completed items per cohort
        # (We need to re-fetch this as it changes)
        cohort_progress = await QueueWarmer._get_cohort_progress(session, campaign.id)
        
        pending_work = False
        
        # Logic: If ANY cohort still needs leads AND has leads available, then NOT done.
        
        # Optimization: We can just check if we can fetch any ONE lead.
        # Reuse logic similar to _fetch_and_queue query but just count.
        
        existing_q_sub = select(QueueItem.lead_id).where(QueueItem.campaign_id == campaign.id)
        
        base_query = select(CampaignLead).where(CampaignLead.campaign_id == campaign.id)
        base_query = base_query.where(CampaignLead.id.not_in(existing_q_sub))
        
        all_targets_met = True
        
        # If no cohort config, we just treat all leads as one pool? 
        # Usually checking existing cohorts.
        
        if not cohort_config:
            # If no manual config, usually implies all leads are valid?
            # Or simplified mode. Check if any leads exist.
            check = await session.execute(select(func.count(CampaignLead.id)).where(
                CampaignLead.campaign_id == campaign.id,
                CampaignLead.id.not_in(existing_q_sub)
            ))
            if check.scalar() > 0:
                pending_work = True
        else:
            # Check each cohort
            for cohort_name, target in cohort_config.items():
                if selected_cohorts and cohort_name not in selected_cohorts:
                    continue
                    
                completed = cohort_progress.get(cohort_name, 0)
                if completed < target:
                    all_targets_met = False
                    
                    # Target not met. Do we have leads for this cohort?
                    cohort_check = await session.execute(select(func.count(CampaignLead.id)).where(
                        CampaignLead.campaign_id == campaign.id,
                        CampaignLead.cohort == cohort_name,
                        CampaignLead.id.not_in(existing_q_sub)
                    ))
                    if cohort_check.scalar() > 0:
                        pending_work = True
                        break
        
        if pending_work:
            return
            
        # If we are here: No active items, and either All targets met OR No leads available for remaining targets.
        logger.info(f"[QueueWarmer] Campaign {campaign.id} execution COMPLETED. (Active={active_count})")
        
        campaign.status = "COMPLETED"
        session.add(campaign)
        await session.commit()
        
        # Broadcast Completion
        try:
            from app.services.websocket_manager import manager
            # Minimal payload for completion
            await manager.broadcast_status_update(str(campaign.id), {"status": "COMPLETED", "progress": 100})
        except Exception:
            pass

