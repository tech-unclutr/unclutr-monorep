"""
Intelligence API Endpoints - Phase 3

Exposes the full intelligence deck with validation and enrichment.
"""

# Force reload - debugging local_kw ghost

from typing import Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from sqlmodel import select

from app.core.db import get_session
from app.core.config import settings
from app.services.intelligence.insight_engine import insight_engine
from app.models.company import Workspace
from pydantic import BaseModel
from typing import Optional
from app.models.insight_tracking import InsightImpression
from app.models.calendar_connection import CalendarConnection
from app.services.intelligence.google_calendar_service import google_calendar_service
from app.api.deps import get_current_active_user
from app.models.user import User
from fastapi.responses import RedirectResponse
from app.services.intelligence.campaign_service import campaign_service
from app.models.campaign import Campaign
from sqlalchemy import desc


router = APIRouter()


class ImpressionCreate(BaseModel):
    brand_id: UUID
    insight_id: str
    clicked: bool = False
    dismissed: bool = False
    action_taken: Optional[str] = None


@router.post("/impression")
async def track_impression(
    impression: ImpressionCreate,
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Track user interaction with an insight.
    """
    try:
        # Verify brand belongs to company (Direct Check)
        from app.models.company import Brand
        stmt = select(Brand).where(Brand.id == impression.brand_id, Brand.company_id == UUID(x_company_id))
        result = await session.execute(stmt)
        brand = result.scalars().first()
        
        if not brand:
            raise HTTPException(status_code=403, detail="Brand not found or access denied")
        
        # Create impression record
        db_impression = InsightImpression(
            brand_id=impression.brand_id,
            insight_id=impression.insight_id,
            clicked=impression.clicked,
            dismissed=impression.dismissed,
            action_taken=impression.action_taken
        )
        
        session.add(db_impression)
        await session.commit()
        
        return {"status": "success", "id": db_impression.id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to track impression: {e}")
        raise HTTPException(status_code=500, detail="Failed to track impression")





@router.get("/deck/{brand_id}")
async def get_intelligence_deck(
    brand_id: UUID,
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
) -> Dict[str, Any]:
    """
    Generate full intelligence deck for a brand.
    
    Returns:
        {
            "insights": [...],  # Top 5 balanced insights
            "full_deck": [...],  # All insights
            "category_distribution": {"financial": 2, "growth": 2, "operational": 1},
            "generation_time_ms": 456.78,
            "generated_at": "2024-01-15T..."
        }
    """
    try:
        # Verify brand belongs to company (Direct Check)
        from app.models.company import Brand
        stmt = select(Brand).where(Brand.id == brand_id, Brand.company_id == UUID(x_company_id))
        result = await session.execute(stmt)
        brand = result.scalars().first()
        
        if not brand:
            raise HTTPException(status_code=403, detail="Brand not found or access denied")
        
        # Generate deck
        deck = await insight_engine.generate_full_deck(session, brand_id)
        
        logger.info(
            f"Intelligence deck API called",
            extra={
                "brand_id": str(brand_id),
                "company_id": x_company_id,
                "insights_count": len(deck.get("insights", []))
            }
        )
        
        return deck
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate intelligence deck: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate intelligence deck")


@router.get("/deck/{brand_id}/top")
async def get_top_insight(
    brand_id: UUID,
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
) -> Dict[str, Any]:
    """
    Get top insight only (Phase 2 compatibility endpoint).
    
    Returns single insight object or empty dict.
    """
    try:
        # Verify brand belongs to company (Direct Check)
        from app.models.company import Brand
        stmt = select(Brand).where(Brand.id == brand_id, Brand.company_id == UUID(x_company_id))
        result = await session.execute(stmt)
        brand = result.scalars().first()
        
        if not brand:
            raise HTTPException(status_code=403, detail="Brand not found or access denied")
        
        # Generate deck and return top 1
        deck = await insight_engine.generate_deck(session, brand_id)
        
        return deck[0] if deck else {}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get top insight: {e}")
        raise HTTPException(status_code=500, detail="Failed to get top insight")


# ------------------------------------------------------------------
# Phase 6: Strategic Advisor Endpoints
# ------------------------------------------------------------------

from app.services.intelligence.playbook_service import playbook_service
from app.services.intelligence.simulation_service import simulation_service
from app.models.insight_feedback import InsightFeedback

class FeedbackCreate(BaseModel):
    insight_id: str
    brand_id: UUID
    status: str # ACCEPTED, REJECTED, etc
    verification_intent: Optional[Dict[str, Any]] = None
    user_comment: Optional[str] = None

class SimulationRequest(BaseModel):
    scenario_type: str
    inputs: Dict[str, Any]

@router.get("/playbook/{insight_type}")
async def get_playbook_endpoint(
    insight_type: str,
    product_id: Optional[str] = None,
    store_domain: Optional[str] = "demo",
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Get dynamic playbook for an insight type.
    """
    context = {"store_domain": store_domain, "product_id": product_id}
    return playbook_service.get_playbook(insight_type, context)

@router.post("/simulation")
async def run_simulation(
    request: SimulationRequest,
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Run a 'What If' simulation.
    """
    return simulation_service.simulate(request.scenario_type, request.inputs)

@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackCreate,
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Submit user feedback and verification intent.
    """
    try:
        # Verify brand belongs to company (Direct Check)
        from app.models.company import Brand
        stmt = select(Brand).where(Brand.id == feedback.brand_id, Brand.company_id == UUID(x_company_id))
        result = await session.execute(stmt)
        brand = result.scalars().first()
        
        if not brand:
             raise HTTPException(status_code=403, detail="Brand not found")

        db_feedback = InsightFeedback(
            insight_id=feedback.insight_id,
            brand_id=feedback.brand_id,
            status=feedback.status,
            verification_intent=feedback.verification_intent,
            verification_status="PENDING" if feedback.verification_intent else "SKIPPED",
            user_comment=feedback.user_comment
        )
        
        session.add(db_feedback)
        await session.commit()
        
        return {"status": "success", "id": db_feedback.id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to save feedback")

# ------------------------------------------------------------------
# Google Calendar Endpoints
# ------------------------------------------------------------------

@router.get("/calendar/google/login")
async def google_calendar_login(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Initiates Google OAuth flow for calendar access.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    auth_url = await google_calendar_service.get_auth_url(
        company_id=company_id,
        user_id=current_user.id
    )
    return {"url": auth_url}

@router.get("/calendar/google/callback")
async def google_calendar_callback(
    code: str,
    state: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Handles Google OAuth callback.
    """
    try:
        await google_calendar_service.handle_callback(code, state, session)
        # Redirect back to frontend customer intelligence tab
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/customer-intelligence?calendar_connected=true")
    except Exception as e:
        logger.error(f"Google OAuth callback failed: {e}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/customer-intelligence?error=calendar_auth_failed")

@router.get("/calendar/status")
async def get_calendar_status(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Checks if Google Calendar is connected and returns availability preview.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        return {"connected": False, "error": "Invalid Company ID"}

    stmt = select(CalendarConnection).where(
        CalendarConnection.company_id == company_id,
        CalendarConnection.provider == "google"
    )
    result = await session.execute(stmt)
    conn = result.scalars().first()
    
    # logger.info(f"DEBUG: get_calendar_status for company {company_id} and user {current_user.id}. Connection found? {bool(conn)}. Status: {conn.status if conn else 'N/A'}")
    
    if not conn or conn.status != "active":
        return {"connected": False}
    
    # Optional: fetch fresh availability for the preview
    # For now, just return status. We can expand this to return busy slots.
    try:
        busy_slots = await google_calendar_service.get_availability(conn)
        return {
            "connected": True,
            "provider": "google",
            "busy_slots": busy_slots,
            "last_synced_at": conn.last_synced_at
        }
    except Exception as e:
        logger.warning(f"Failed to fetch availability: {e}")
        return {
            "connected": True,
            "provider": "google",
            "error": "Failed to fetch real-time availability"
        }
    finally:
        # logger.info(f"Calendar status for user {current_user.id}: {isCalendarConnected if 'isCalendarConnected' in locals() else 'checked'}")
        pass

@router.post("/calendar/webhook")
async def google_calendar_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Receives push notifications from Google Calendar.
    """
    # Google sends channel ID in X-Goog-Channel-ID header
    channel_id = request.headers.get("X-Goog-Channel-ID")
    resource_state = request.headers.get("X-Goog-Resource-State")
    
    logger.info(f"Received Google Calendar Webhook: Channel={channel_id}, State={resource_state}")
    
    if not channel_id:
        return {"status": "ignored"}
    
    # Resource state 'sync' is just a confirmation of watch registration
    if resource_state == "sync":
        return {"status": "synced"}
        
    # Find the connection
    try:
        stmt = select(CalendarConnection).where(CalendarConnection.id == UUID(channel_id))
        result = await session.execute(stmt)
        conn = result.scalars().first()
        
        if conn:
            # Mark as synced now
            conn.last_synced_at = datetime.utcnow()
            session.add(conn)
            await session.commit()
            logger.info(f"Updated last_synced_at for connection {conn.id}")
            
    except Exception as e:
        logger.error(f"Failed to process Google Calendar webhook: {e}")
        
    return {"status": "received"}

@router.delete("/calendar/disconnect")
async def disconnect_google_calendar(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Disconnects Google Calendar for the company.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    success = await google_calendar_service.disconnect_calendar(session, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="No active calendar connection found")
    
    return {"status": "success", "message": "Calendar disconnected"}


class PhoneInterviewTriggerRequest(BaseModel):
    phone_number: str
    campaign_id: Optional[UUID] = None


@router.post("/interview/trigger")
async def trigger_phone_interview(
    request: PhoneInterviewTriggerRequest,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Triggers a REAL phone call via Bolna API.
    Creates initial campaign record with status INITIATED.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    # Validate phone number format (basic E.164 check)
    import re
    if not re.match(r'^\+[1-9]\d{1,14}$', request.phone_number):
        raise HTTPException(
            status_code=400, 
            detail="Invalid phone number format. Use E.164 format (e.g., +14155551234)"
        )



    campaign = None
    
    try:
        from app.services.intelligence.bolna_service import bolna_service
        import httpx
        
        # 1. Get or Create Campaign
        if request.campaign_id:
            # Fetch existing campaign
            stmt = select(Campaign).where(
                Campaign.id == request.campaign_id,
                Campaign.company_id == company_id,
                Campaign.user_id == current_user.id
            )
            result = await session.execute(stmt)
            campaign = result.scalars().first()
            
            if not campaign:
                raise HTTPException(status_code=404, detail="Campaign not found for retry")
                
            logger.info(f"Retrying existing campaign: {campaign.id}")
        else:
            # Create new initial campaign
            campaign = await campaign_service.create_initial_campaign(
                session=session,
                company_id=company_id,
                user_id=current_user.id,
                phone_number=request.phone_number
            )
            logger.info(f"Created new campaign: {campaign.id} to DB. Status: {campaign.status}")
        
        # 2. Trigger Bolna Call (Passing Campaign ID)
        try:
            bolna_response = await bolna_service.trigger_phone_call(
                phone_number=request.phone_number,
                user_full_name=current_user.full_name,
                company_id=str(company_id),
                user_id=current_user.id,
                campaign_id=str(campaign.id) 
            )
        except httpx.HTTPStatusError as e:
            # If call fails, mark campaign as FAILED immediately if newly created?
            # Actually, let's keep it basic for now, handled by exceptions below.
            
            # Re-raise to handle with specific status codes
            raise e
            
        # Extract execution ID
        execution_id = bolna_response.get("id") or bolna_response.get("execution_id") or bolna_response.get("call_id")
        
        if not execution_id:
            logger.error(f"Bolna response missing execution ID. Full response: {bolna_response}")
            raise HTTPException(
                status_code=500, 
                detail="Bolna API did not return execution ID. Please check the logs or contact support."
            )
        
        # 3. Update Campaign with Execution ID
        campaign = await campaign_service.update_campaign_execution_id(
            session=session,
            campaign_id=campaign.id,
            new_execution_id=execution_id
        )
        
        return {
            "status": "success",
            "execution_id": execution_id,
            "campaign_id": str(campaign.id),
            "message": f"Phone call initiated to {request.phone_number}"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        # Configuration errors (missing API keys, etc.)
        logger.error(f"Bolna configuration error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Phone interview service is not properly configured. Please contact support."
        )
    except httpx.TimeoutException:
        logger.error("Bolna API timeout")
        raise HTTPException(
            status_code=504, 
            detail="Request to phone service timed out. Please try again."
        )
    except Exception as e:
        import traceback
        logger.error(f"Failed to trigger phone interview: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred: {str(e)}"
        )



@router.post("/interview/bolna-webhook")
async def bolna_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Receives webhook from Bolna when call completes.
    Updates campaign with all execution data and generates campaign name.
    """
    try:
        # Parse webhook payload
        payload = await request.json()
        logger.info(f"Received Bolna webhook: {payload.get('id')}")
        
        from app.services.intelligence.bolna_service import bolna_service
        
        # Parse and validate payload
        parsed_payload = bolna_service.parse_webhook_payload(payload)
        execution_id = parsed_payload.get("execution_id")
        
        if not execution_id:
            logger.error("Webhook payload missing execution ID")
            return {"status": "error", "message": "Missing execution ID"}
        
        # Update campaign from webhook data
        campaign = await campaign_service.update_campaign_from_bolna_webhook(
            session=session,
            execution_id=execution_id,
            bolna_payload=parsed_payload
        )
        
        logger.info(f"Campaign {campaign.id} updated from webhook. Status: {campaign.status}")
        
        return {
            "status": "success",
            "campaign_id": str(campaign.id),
            "campaign_name": campaign.name,
            "call_status": campaign.bolna_call_status
        }
        
    except ValueError as e:
        logger.error(f"Campaign not found for webhook: {e}")
        return {"status": "error", "message": str(e)}
    except Exception as e:
        logger.error(f"Failed to process Bolna webhook: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/interview/simulate")
async def simulate_interview(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    LEGACY: Triggers the Bolna-first intake simulation (for testing without real calls).
    Creates a detailed mock transcript and extracts campaign data via Gemini.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    try:
        campaign = await campaign_service.simulate_intake_call(session, company_id, current_user.id)
        return {
            "status": "success", 
            "campaign_id": campaign.id,
            "quality_score": campaign.quality_score,
            "transcript_summary": "Simulation completed."
        }
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        # Return 500 but detail properly
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")




class ExtractedDataUpdate(BaseModel):
    extracted_data: Dict[str, Any]


@router.patch("/campaigns/{campaign_id}/extracted-data")
async def update_campaign_extracted_data(
    campaign_id: UUID,
    update_data: ExtractedDataUpdate,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Manually update the extracted data for a campaign.
    Useful for correcting or refining the AI's extraction.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    # Verify ownership
    stmt = select(Campaign).where(
        Campaign.id == campaign_id,
        Campaign.company_id == company_id, 
        Campaign.user_id == current_user.id
    )
    result = await session.execute(stmt)
    campaign = result.scalars().first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    try:
        updated_campaign = await campaign_service.update_campaign_extracted_data(
            session=session,
            campaign_id=campaign_id,
            new_extracted_data=update_data.extracted_data
        )
        return updated_campaign
    except Exception as e:
        logger.error(f"Failed to update extracted data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update data: {str(e)}")


@router.get("/campaigns/{campaign_id}")
async def get_campaign_by_id(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Retrieve a specific campaign by ID (for polling during phone interview).
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    stmt = select(Campaign).where(
        Campaign.id == campaign_id,
        Campaign.company_id == company_id,
        Campaign.user_id == current_user.id
    )

    result = await session.execute(stmt)
    campaign = result.scalars().first()

    if not campaign:
        logger.warning(f"Campaign not found in DB. Search params: ID={campaign_id}, Company={company_id}, User={current_user.id}")
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Active Sync: Check with Bolna if the campaign is stuck in a non-terminal state
    # This acts as a fallback if webhooks fail (e.g. local dev, ngrok issues)
    # MOVED TO BACKGROUND TASK to prevent blocking API response
    if campaign.status not in ["COMPLETED", "FAILED"] and campaign.bolna_execution_id:
        # Fire and forget background sync
        background_tasks.add_task(campaign_service.sync_campaign_background, campaign.id)

    return campaign


@router.get("/campaigns/latest")
async def get_latest_campaign(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the most recent Campaign for the current user.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID")
        
    stmt = select(Campaign).where(
        Campaign.company_id == company_id,
        Campaign.user_id == current_user.id
    ).order_by(desc(Campaign.created_at)).limit(1)
    
    result = await session.execute(stmt)
    campaign = result.scalars().first()
    
    if not campaign:
        return {"campaign": None}
        
    return {"campaign": campaign}


@router.get("/campaigns")
async def list_campaigns(
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    List campaigns for the company with pagination.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID")
        
    stmt = select(Campaign).where(
        Campaign.company_id == company_id
    ).order_by(desc(Campaign.created_at)).offset(offset).limit(limit)
    
    result = await session.execute(stmt)
    campaigns = result.scalars().all()
    
    return {"campaigns": campaigns}
