from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
from app.core.db import get_session
from app.core.security import get_current_user
from app.services.metrics_service import MetricsService
from app.models.metrics import (
    BusinessMetrics,
    OnboardingMetrics,
    UserMetrics,
    IntegrationMetrics
)
from app.models.onboarding_state import OnboardingState
from app.models.integration import Integration
from app.models.company import Company
import logging
import csv
import io

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/overview")
async def get_metrics_overview(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get overview metrics for the control tower dashboard.
    Returns high-level KPIs and recent activity.
    """
    try:
        overview = await MetricsService.get_overview_metrics(session)
        return overview
    except Exception as e:
        logger.error(f"Error getting overview metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/business")
async def get_business_metrics(
    days: int = Query(default=30, ge=1, le=365),
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get business metrics for the specified number of days.
    Returns daily KPIs including users, companies, workspaces, and integrations.
    """
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        stmt = select(BusinessMetrics).where(
            BusinessMetrics.metric_date >= start_date
        ).order_by(BusinessMetrics.metric_date.desc())
        
        result = await session.exec(stmt)
        metrics = result.all()
        
        # If no metrics exist for today, calculate them
        if not metrics or metrics[0].metric_date != end_date:
            today_metrics = await MetricsService.calculate_business_metrics(session, end_date)
            metrics = [today_metrics] + list(metrics)
        
        return {
            "metrics": [
                {
                    "date": m.metric_date.isoformat(),
                    "total_users": m.total_users,
                    "active_users_daily": m.active_users_daily,
                    "active_users_weekly": m.active_users_weekly,
                    "active_users_monthly": m.active_users_monthly,
                    "new_users": m.new_users,
                    "total_companies": m.total_companies,
                    "new_companies": m.new_companies,
                    "total_workspaces": m.total_workspaces,
                    "total_integrations": m.total_integrations,
                    "onboarding_started": m.onboarding_started,
                    "onboarding_completed": m.onboarding_completed,
                    "onboarding_completion_rate": m.onboarding_completion_rate
                }
                for m in metrics
            ]
        }
    except Exception as e:
        logger.error(f"Error getting business metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/onboarding")
async def get_onboarding_metrics(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get onboarding funnel metrics.
    Returns completion rates, drop-off points, and average time per step.
    """
    try:
        # Get all onboarding states
        stmt = select(OnboardingState)
        result = await session.exec(stmt)
        all_onboarding = result.all()
        
        total = len(all_onboarding)
        completed = len([o for o in all_onboarding if o.is_completed])
        
        # Count by step
        step_counts = {
            "basics": 0,
            "channels": 0,
            "stack": 0,
            "finish": 0
        }
        
        for onboarding in all_onboarding:
            step_counts[onboarding.current_page] = step_counts.get(onboarding.current_page, 0) + 1
        
        # Get detailed metrics
        metrics_stmt = select(OnboardingMetrics)
        metrics_result = await session.exec(metrics_stmt)
        all_metrics = metrics_result.all()
        
        # Calculate averages
        avg_drawer_opens = sum(m.drawer_opens for m in all_metrics) / len(all_metrics) if all_metrics else 0
        avg_search_uses = sum(m.search_uses for m in all_metrics) / len(all_metrics) if all_metrics else 0
        avg_datasources = sum(m.datasources_selected for m in all_metrics) / len(all_metrics) if all_metrics else 0
        
        # Calculate average time to complete
        completed_metrics = [m for m in all_metrics if m.completed_at]
        avg_completion_time = sum(m.total_duration_seconds for m in completed_metrics if m.total_duration_seconds) / len(completed_metrics) if completed_metrics else 0
        
        return {
            "total_started": total,
            "total_completed": completed,
            "completion_rate": (completed / total * 100) if total > 0 else 0,
            "step_distribution": step_counts,
            "avg_drawer_opens": round(avg_drawer_opens, 2),
            "avg_search_uses": round(avg_search_uses, 2),
            "avg_datasources_selected": round(avg_datasources, 2),
            "avg_completion_time_seconds": round(avg_completion_time, 2),
            "avg_completion_time_minutes": round(avg_completion_time / 60, 2)
        }
    except Exception as e:
        logger.error(f"Error getting onboarding metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/integrations")
async def get_integration_metrics(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get integration health metrics.
    Returns sync success rates, error rates, and performance metrics.
    """
    try:
        # Get all integrations
        stmt = select(Integration)
        result = await session.exec(stmt)
        integrations = result.all()
        
        total = len(integrations)
        active = len([i for i in integrations if i.status == "active"])
        error = len([i for i in integrations if i.status == "error"])
        
        # Get integration metrics
        metrics_stmt = select(IntegrationMetrics)
        metrics_result = await session.exec(metrics_stmt)
        all_metrics = metrics_result.all()
        
        # Calculate aggregates
        total_syncs = sum(m.sync_attempts for m in all_metrics)
        successful_syncs = sum(m.sync_successes for m in all_metrics)
        failed_syncs = sum(m.sync_failures for m in all_metrics)
        
        success_rate = (successful_syncs / total_syncs * 100) if total_syncs > 0 else 0
        
        avg_health_score = sum(m.health_score for m in all_metrics) / len(all_metrics) if all_metrics else 100
        
        return {
            "total_integrations": total,
            "active_integrations": active,
            "error_integrations": error,
            "total_sync_attempts": total_syncs,
            "successful_syncs": successful_syncs,
            "failed_syncs": failed_syncs,
            "success_rate": round(success_rate, 2),
            "avg_health_score": round(avg_health_score, 2)
        }
    except Exception as e:
        logger.error(f"Error getting integration metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customers")
async def get_customer_metrics(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of customers with their metrics.
    Returns company information, member counts, and health scores.
    """
    try:
        customers = await MetricsService.get_customer_list(session, limit, offset)
        
        # Get total count
        from sqlmodel import func
        count_stmt = select(func.count(Company.id))
        count_result = await session.exec(count_stmt)
        total_count = count_result.one()
        
        return {
            "customers": customers,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error getting customer metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_user_metrics(
    days: int = Query(default=7, ge=1, le=90),
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user engagement metrics for the specified number of days.
    Returns daily engagement scores and activity metrics.
    """
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        stmt = select(UserMetrics).where(
            UserMetrics.metric_date >= start_date
        ).order_by(UserMetrics.metric_date.desc())
        
        result = await session.exec(stmt)
        metrics = result.all()
        
        # Group by date and calculate aggregates
        daily_metrics = {}
        for m in metrics:
            date_key = m.metric_date.isoformat()
            if date_key not in daily_metrics:
                daily_metrics[date_key] = {
                    "date": date_key,
                    "total_users": 0,
                    "total_interactions": 0,
                    "total_page_views": 0,
                    "avg_engagement_score": 0,
                    "engagement_scores": []
                }
            
            daily_metrics[date_key]["total_users"] += 1
            daily_metrics[date_key]["total_interactions"] += m.interactions
            daily_metrics[date_key]["total_page_views"] += m.page_views
            daily_metrics[date_key]["engagement_scores"].append(m.engagement_score)
        
        # Calculate averages
        for date_key in daily_metrics:
            scores = daily_metrics[date_key]["engagement_scores"]
            daily_metrics[date_key]["avg_engagement_score"] = round(
                sum(scores) / len(scores), 2
            ) if scores else 0
            del daily_metrics[date_key]["engagement_scores"]
        
        return {
            "metrics": list(daily_metrics.values())
        }
    except Exception as e:
        logger.error(f"Error getting user metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/customers")
async def export_customers_csv(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Export customer data as CSV.
    """
    try:
        customers = await MetricsService.get_customer_list(session, limit=1000, offset=0)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "id", "name", "currency", "created_at", "member_count",
            "brand_count", "workspace_count", "integration_count", "health_score"
        ])
        writer.writeheader()
        writer.writerows(customers)
        
        csv_content = output.getvalue()
        output.close()
        
        from fastapi.responses import Response
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=customers_{date.today().isoformat()}.csv"
            }
        )
    except Exception as e:
        logger.error(f"Error exporting customers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calculate/daily")
async def calculate_daily_metrics(
    target_date: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Manually trigger calculation of daily metrics.
    Useful for backfilling or recalculating metrics.
    """
    try:
        calc_date = date.fromisoformat(target_date) if target_date else date.today()
        
        # Calculate business metrics
        business_metrics = await MetricsService.calculate_business_metrics(session, calc_date)
        
        return {
            "status": "success",
            "date": calc_date.isoformat(),
            "metrics": {
                "total_users": business_metrics.total_users,
                "total_companies": business_metrics.total_companies,
                "total_workspaces": business_metrics.total_workspaces,
                "total_integrations": business_metrics.total_integrations
            }
        }
    except Exception as e:
        logger.error(f"Error calculating daily metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
