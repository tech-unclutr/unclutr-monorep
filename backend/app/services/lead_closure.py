"""
Lead Closure Service

Handles closing leads at all drop-off points in the lead lifecycle.
This ensures proper tracking and analytics for lead outcomes.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.queue_item import QueueItem
from app.models.user_queue_item import UserQueueItem
import logging

logger = logging.getLogger(__name__)

from app.models.campaign_lead import CampaignLead

class LeadClosure:
    """Service for managing lead closure at all lifecycle drop-off points."""
    
    # AI Queue Closure Reasons
    CLOSURE_DNC = "DNC"  # Do Not Call request
    CLOSURE_WRONG_PERSON = "WRONG_PERSON"  # Wrong contact person
    CLOSURE_NO_INTENT = "NO_INTENT"  # No interest expressed
    CLOSURE_MAX_RETRIES_AI = "MAX_RETRIES_AI"  # AI agent max retries exceeded
    CLOSURE_FAILED = "FAILED"  # Call failed (technical issues)
    
    # User Queue Closure Reasons
    CLOSURE_WON = "WON"  # Successfully booked/converted
    CLOSURE_LOST = "LOST"  # Not interested after human contact
    CLOSURE_UNREACHABLE = "UNREACHABLE"  # Multiple failed contact attempts
    
    @staticmethod
    async def close_ai_queue_lead(
        session: AsyncSession,
        lead_id: UUID,
        reason: str,
        source: str = "AI_QUEUE"
    ) -> Optional[QueueItem]:
        """
        Close a lead in the AI queue.
        
        Args:
            session: Database session
            lead_id: ID of the lead to close
            reason: Closure reason (DNC, WRONG_PERSON, NO_INTENT, MAX_RETRIES_AI, FAILED)
            source: Source of closure (for logging)
            
        Returns:
            Updated QueueItem or None if not found
        """
        try:
            # Find the queue item
            result = await session.execute(
                select(QueueItem).where(QueueItem.lead_id == lead_id)
            )
            queue_item = result.scalar_one_or_none()
            
            if not queue_item:
                logger.warning(f"Queue item not found for lead {lead_id}")
                return None
            
            # Update status and closure reason
            queue_item.status = "CLOSED"
            queue_item.closure_reason = reason
            queue_item.updated_at = datetime.utcnow()
            
            session.add(queue_item)
            
            # [FIX] Also close the CampaignLead to reflect final status
            lead_result = await session.execute(
                select(CampaignLead).where(CampaignLead.id == lead_id)
            )
            campaign_lead = lead_result.scalar_one_or_none()
            
            if campaign_lead:
                if reason == LeadClosure.CLOSURE_FAILED:
                     campaign_lead.status = "FAILED"
                else:
                     campaign_lead.status = "PROCESSED"
                session.add(campaign_lead)
            
            await session.commit()
            await session.refresh(queue_item)
            
            logger.info(
                f"Closed AI queue lead {lead_id} with reason {reason} from {source}"
            )
            
            return queue_item
            
        except Exception as e:
            logger.error(f"Error closing AI queue lead {lead_id}: {e}")
            await session.rollback()
            raise
    
    @staticmethod
    async def close_user_queue_lead(
        session: AsyncSession,
        user_queue_item_id: UUID,
        reason: str
    ) -> Optional[UserQueueItem]:
        """
        Close a lead in the user queue.
        
        Args:
            session: Database session
            user_queue_item_id: ID of the user queue item to close
            reason: Closure reason (WON, LOST, UNREACHABLE)
            
        Returns:
            Updated UserQueueItem or None if not found
        """
        try:
            # Find the user queue item
            result = await session.execute(
                select(UserQueueItem).where(UserQueueItem.id == user_queue_item_id)
            )
            user_queue_item = result.scalar_one_or_none()
            
            if not user_queue_item:
                logger.warning(f"User queue item {user_queue_item_id} not found")
                return None
            
            # Update status and closure
            user_queue_item.status = "CLOSED"
            user_queue_item.closure_reason = reason
            user_queue_item.closed_at = datetime.utcnow()
            user_queue_item.updated_at = datetime.utcnow()
            
            session.add(user_queue_item)
            
            # Also close the original queue item
            if user_queue_item.original_queue_item_id:
                original_result = await session.execute(
                    select(QueueItem).where(
                        QueueItem.id == user_queue_item.original_queue_item_id
                    )
                )
                original_queue_item = original_result.scalar_one_or_none()
                
                if original_queue_item:
                    original_queue_item.status = "CLOSED"
                    original_queue_item.closure_reason = f"USER_QUEUE_{reason}"
                    original_queue_item.updated_at = datetime.utcnow()
                    session.add(original_queue_item)
            
            await session.commit()
            await session.refresh(user_queue_item)
            
            # [FIX] Also close the CampaignLead to reflect final status
            lead_result = await session.execute(
                select(CampaignLead).where(CampaignLead.id == user_queue_item.lead_id)
            )
            campaign_lead = lead_result.scalar_one_or_none()
            
            if campaign_lead:
                campaign_lead.status = "PROCESSED"
                session.add(campaign_lead)
                await session.commit()
            
            logger.info(
                f"Closed user queue lead {user_queue_item_id} with reason {reason}"
            )
            
            # [NEW] Check backpressure after lead is closed (Floor check)
            from app.services.user_queue_warmer import UserQueueWarmer
            await UserQueueWarmer.check_backpressure(session, user_queue_item.campaign_id)
            
            return user_queue_item
            
        except Exception as e:
            logger.error(f"Error closing user queue lead {user_queue_item_id}: {e}")
            await session.rollback()
            raise
    
    @staticmethod
    async def should_close_on_retry_limit(
        session: AsyncSession,
        user_queue_item_id: UUID
    ) -> bool:
        """
        Check if a user queue item should be closed due to retry limit.
        
        Args:
            session: Database session
            user_queue_item_id: ID of the user queue item
            
        Returns:
            True if should be closed, False otherwise
        """
        try:
            result = await session.execute(
                select(UserQueueItem).where(UserQueueItem.id == user_queue_item_id)
            )
            user_queue_item = result.scalar_one_or_none()
            
            if not user_queue_item:
                return False
            
            return user_queue_item.retry_count >= user_queue_item.max_retries
            
        except Exception as e:
            logger.error(f"Error checking retry limit for {user_queue_item_id}: {e}")
            return False
