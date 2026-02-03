from typing import List, Dict, Tuple, Optional
from uuid import UUID
from datetime import datetime
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func, and_, or_
import random

from app.models.campaign import Campaign
from app.models.cohort import Cohort
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.services.bolna_caller import BolnaCaller

class QueueWarmer:
    
    @staticmethod
    async def check_and_replenish(campaign_id: UUID, session: AsyncSession):
        """
        Main Loop: Determines who goes from READY -> ACTIVE, and Backlog -> READY.
        """
        # 1. Fetch Campaign & Config
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            return
            
        config = campaign.execution_config or {}
        
        
        # 0. Status Check - Skip if COMPLETED
        if campaign.status == "COMPLETED":
            print(f"[QueueWarmer] Campaign {campaign_id} is COMPLETED. Skipping replenishment.")
            return
        
        # Standby Check: We allow replenishment (Backlog -> READY) in PAUSED state,
        # but only allow promotion (READY -> ACTIVE) in ACTIVE/IN_PROGRESS states.


        # --- STAGE 0: WAKE UP SCHEDULED CALLS ---
        await QueueWarmer._wake_scheduled_items(session, campaign)

        # --- STAGE 1: REPLENISHMENT (BACKLOG -> READY) ---
        # Ensure Upcoming Queue has enough people BEFORE promotion
        TARGET_BUFFER = config.get("target_ready_buffer", 3)
        
        buffer_count_result = await session.execute(
            select(func.count(QueueItem.id))
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status == "READY")
        )
        current_buffer = buffer_count_result.one()[0]
        
        needed = TARGET_BUFFER - current_buffer
        
        if needed > 0:
            await QueueWarmer._replenish_buffer_strategy(session, campaign, needed)
            # Commit replenishment so promotion can see the new items
            await session.commit()

        # --- STAGE 2: PROMOTION (READY -> ACTIVE) ---
        # Traffic Cop: Respect Max Concurrency
        MAX_CONCURRENCY = config.get("max_concurrent_calls", 2) 
        
        active_count_result = await session.execute(
            select(func.count(QueueItem.id))
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status == "DIALING_INTENT")
        )
        active_count = active_count_result.one()[0]
        
        slots_available = MAX_CONCURRENCY - active_count
        
        if slots_available > 0 and campaign.status in ["ACTIVE", "IN_PROGRESS"]:
            await QueueWarmer._promote_buffer(session, campaign, slots_available)

    @staticmethod
    async def _promote_buffer(session: AsyncSession, campaign: Campaign, slots: int):
        """
        Moves top priority items from READY -> DIALING_INTENT and triggers calls.
        """
        # Pick top priority READY items
        stmt = (
            select(QueueItem)
            .where(QueueItem.campaign_id == campaign.id)
            .where(QueueItem.status == "READY")
            .order_by(QueueItem.priority_score.desc(), QueueItem.created_at.asc())
            .limit(slots)
        )
        result = await session.execute(stmt)
        items = result.scalars().all()
        
        if not items:
            return
            
        # Update status and collect IDs
        lead_ids = []
        queue_item_ids = []
        
        for item in items:
            item.status = "DIALING_INTENT"
            session.add(item)
            lead_ids.append(item.lead_id)
            queue_item_ids.append(item.id)
            
        await session.commit()
        
        # [NEW] Broadcast the 'DIALING_INTENT' state immediately to the UI
        # This ensures the user sees "Dialing..." while the Bolna API request is in flight.
        try:
            from app.services.websocket_manager import manager
            from app.api.v1.endpoints.execution import get_campaign_realtime_status_internal
            status_data = await get_campaign_realtime_status_internal(campaign.id, session, trigger_warmer=False)
            await manager.broadcast_status_update(str(campaign.id), status_data)
        except Exception as broadcast_err:
            print(f"[QueueWarmer] Early broadcast failed: {broadcast_err}")
        
        # Trigger Bolna
        print(f"[QueueWarmer] Promoting {len(items)} items to Active Dialing...")
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
                    print(f"[QueueWarmer] Window expired for campaign {campaign.id}. Pausing.")
                    campaign.status = "PAUSED"
                    # Add flag to meta_data for frontend alerting
                    meta = campaign.meta_data or {}
                    meta["window_expired"] = True
                    campaign.meta_data = meta
                    session.add(campaign)
                
                for item in items:
                    item.status = "FAILED"
                    session.add(item)
                await session.commit()
                return

            if call_results and "results" in call_results:
                for i, res in enumerate(call_results["results"]):
                    if res.get("status") == "error":
                        if i < len(items):
                            items[i].status = "FAILED"
                            items[i].outcome = res.get("error") or "Unknown Error"
                            session.add(items[i])
                await session.commit()
            
            # Broadcast the new state to the UI via WebSocket
            try:
                from app.services.websocket_manager import manager
                from app.api.v1.endpoints.execution import get_campaign_realtime_status_internal
                
                # Fetch full state
                status_data = await get_campaign_realtime_status_internal(campaign.id, session, trigger_warmer=False)
                
                # Broadcast
                await manager.broadcast_status_update(str(campaign.id), status_data)
                print(f"[QueueWarmer] Broadcasted state update for campaign {campaign.id}")
            except Exception as broadcast_err:
                print(f"[QueueWarmer] Failed to broadcast state update: {broadcast_err}")
                
        except Exception as e:
            print(f"[QueueWarmer] Promotion Failed: {e}")
            for item in items:
                item.status = "FAILED"
                session.add(item)
            await session.commit()


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
    async def _replenish_buffer_strategy(session: AsyncSession, campaign: Campaign, count: int):
        """
        Selects best leads from Backlog -> READY based on Cohort Strategy.
        Excludes cohorts that have reached their target call count.
        """
        # 1. Determine Target Cohort (Strategy)
        cohort_config = campaign.cohort_config or {} 
        selected_cohorts = campaign.selected_cohorts or []
        
        # NEW: Get completed call counts per cohort
        cohort_progress = await QueueWarmer._get_cohort_progress(session, campaign.id)
        
        # NEW: Filter out cohorts that have reached their target
        eligible_cohorts = {}
        for cohort_name, target_count in cohort_config.items():
            if selected_cohorts and cohort_name not in selected_cohorts:
                continue
            
            completed_count = cohort_progress.get(cohort_name, 0)
            if completed_count < target_count:
                eligible_cohorts[cohort_name] = target_count
            else:
                print(f"[QueueWarmer] Cohort '{cohort_name}' reached target ({completed_count}/{target_count} completed)")
        
        # If no eligible cohorts, stop replenishment
        if not eligible_cohorts:
            print(f"[QueueWarmer] All cohort targets reached. Stopping replenishment.")
            return
        
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

        if not eligible_cohorts:
            # Fallback: Equal weights if no config
            cohorts_result = await session.execute(select(Cohort).where(Cohort.campaign_id == campaign.id))
            cohorts = cohorts_result.scalars().all()
            eligible_cohorts = {c.name: 1 for c in cohorts}
            
        total_weight = sum(eligible_cohorts.values())
        if total_weight == 0: 
            return  # No eligible cohorts
        
        scores = {}
        for cohort_name, weight in eligible_cohorts.items():
            target_share = weight / total_weight
            actual_count = buffer_counts.get(cohort_name, 0)
            actual_share = actual_count / total_buffer if total_buffer > 0 else 0
            scores[cohort_name] = target_share - actual_share
            
        target_cohort_name = None
        if scores:
            target_cohort_name = max(scores, key=scores.get)
            
        # 2. Fetch from Backlog -> READY
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
        
        candidates_result = await session.execute(query)
        candidates = candidates_result.scalars().all()
        
        if not candidates:
             if cohort_name:
                 # Fallback to any cohort if target is empty
                 await QueueWarmer._fetch_and_queue(session, campaign, None, count)
             return

        print(f"[QueueWarmer] Queueing {len(candidates)} leads (Backlog -> READY)...")
        
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
                print(f"[QueueWarmer] Skipping lead {lead.id} - already has queue item (status: {existing_item.status})")
                continue
            
            item = QueueItem(
                campaign_id=campaign.id,
                lead_id=lead.id,
                status="READY", # Staged for promotion
                cohort_id=cohort_id,
                priority_score=0 
            )
            session.add(item)
            
            
        await session.commit()

    @staticmethod
    async def _wake_scheduled_items(session: AsyncSession, campaign: Campaign):
        """
        Checks for SCHEDULED items that are due (scheduled_for <= Now).
        Promotes them to READY with High Priority.
        """
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

        print(f"[QueueWarmer] Waking up {len(items)} scheduled calls...")
        
        for item in items:
            item.status = "READY"
            item.priority_score = 999 # Highest priority to ensure immediate pickup
            session.add(item)
            
        await session.commit()


