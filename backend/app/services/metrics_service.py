import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List

from sqlmodel import and_, func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.audit import AuditTrail
from app.models.company import Brand, Company, Workspace
from app.models.iam import CompanyMembership
from app.models.integration import Integration
from app.models.metrics import BusinessMetrics, OnboardingMetrics, UserMetrics
from app.models.onboarding_state import OnboardingState
from app.models.user import User

logger = logging.getLogger(__name__)

class MetricsService:
    """Service for calculating and aggregating metrics"""
    
    @staticmethod
    async def calculate_user_metrics(
        session: AsyncSession,
        user_id: str,
        target_date: date
    ) -> UserMetrics:
        """Calculate daily user engagement metrics"""
        
        # Get or create metrics record for this user and date
        stmt = select(UserMetrics).where(
            and_(
                UserMetrics.user_id == user_id,
                UserMetrics.metric_date == target_date
            )
        )
        result = await session.exec(stmt)
        metrics = result.first()
        
        if not metrics:
            metrics = UserMetrics(user_id=user_id, metric_date=target_date)
        
        # Calculate metrics from audit trail
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        
        audit_stmt = select(AuditTrail).where(
            and_(
                AuditTrail.actor_id == user_id,
                AuditTrail.created_at >= start_of_day,
                AuditTrail.created_at <= end_of_day
            )
        )
        audit_result = await session.exec(audit_stmt)
        audit_logs = audit_result.all()
        
        # Count interactions
        metrics.interactions = len(audit_logs)
        
        # Count page views (actions that indicate page navigation)
        page_view_actions = [log for log in audit_logs if 'view' in log.action.lower() or 'navigate' in log.action.lower()]
        metrics.page_views = len(page_view_actions)
        
        # Track features used
        features_used = {}
        for log in audit_logs:
            feature = log.resource_type
            features_used[feature] = features_used.get(feature, 0) + 1
        metrics.features_used = features_used
        
        # Calculate engagement score (simple formula, can be refined)
        # Score based on: interactions (40%), page views (30%), features used (30%)
        interaction_score = min(metrics.interactions / 10, 1.0) * 40
        page_view_score = min(metrics.page_views / 20, 1.0) * 30
        feature_score = min(len(features_used) / 5, 1.0) * 30
        metrics.updated_at = datetime.utcnow()
        
        try:
            session.add(metrics)
            await session.commit()
            await session.refresh(metrics)
        except Exception as e:
            await session.rollback()
            logger.warning(f"Race condition in calculate_user_metrics for {user_id}: {e}")
            stmt = select(UserMetrics).where(
                and_(UserMetrics.user_id == user_id, UserMetrics.metric_date == target_date)
            )
            res = await session.exec(stmt)
            existing = res.first()
            if existing:
                for key, val in metrics.dict(exclude={"id", "created_at"}).items():
                    setattr(existing, key, val)
                existing.updated_at = datetime.utcnow()
                session.add(existing)
                await session.commit()
                metrics = existing
        
        return metrics
    
    @staticmethod
    async def calculate_onboarding_metrics(
        session: AsyncSession,
        user_id: str
    ) -> OnboardingMetrics:
        """Calculate onboarding funnel metrics for a user"""
        
        # Get or create onboarding metrics
        stmt = select(OnboardingMetrics).where(OnboardingMetrics.user_id == user_id)
        result = await session.exec(stmt)
        metrics = result.first()
        
        if not metrics:
            metrics = OnboardingMetrics(user_id=user_id)
        
        # Get onboarding state
        onboarding_stmt = select(OnboardingState).where(OnboardingState.user_id == user_id)
        onboarding_result = await session.exec(onboarding_stmt)
        onboarding = onboarding_result.first()
        
        if onboarding:
            # Track completion
            if onboarding.is_completed and not metrics.completed_at:
                metrics.completed_at = datetime.utcnow()
                metrics.total_duration_seconds = int(
                    (metrics.completed_at - metrics.started_at).total_seconds()
                )
            
            # Track last step visited
            metrics.last_step_visited = onboarding.current_page
            
            # Count drawer interactions from audit trail
            audit_stmt = select(func.count(AuditTrail.id)).where(
                and_(
                    AuditTrail.actor_id == user_id,
                    AuditTrail.action.like('%drawer%')
                )
            )
            drawer_result = await session.exec(audit_stmt)
            metrics.drawer_opens = drawer_result.one()
            
            # Count datasource selections
            datasource_stmt = select(func.count(AuditTrail.id)).where(
                and_(
                    AuditTrail.actor_id == user_id,
                    AuditTrail.action.like('%datasource%selected%')
                )
            )
            datasource_result = await session.exec(datasource_stmt)
            metrics.datasources_selected = datasource_result.one()
        
        metrics.updated_at = datetime.utcnow()
        
        try:
            session.add(metrics)
            await session.commit()
            await session.refresh(metrics)
        except Exception as e:
            await session.rollback()
            logger.warning(f"Race condition in calculate_onboarding_metrics for {user_id}: {e}")
            stmt = select(OnboardingMetrics).where(OnboardingMetrics.user_id == user_id)
            res = await session.exec(stmt)
            existing = res.first()
            if existing:
                for key, val in metrics.dict(exclude={"id", "created_at"}).items():
                    setattr(existing, key, val)
                existing.updated_at = datetime.utcnow()
                session.add(existing)
                await session.commit()
                metrics = existing
        
        return metrics
    
    @staticmethod
    async def calculate_business_metrics(
        session: AsyncSession,
        target_date: date
    ) -> BusinessMetrics:
        """Calculate daily business KPIs"""
        
        # Get or create business metrics for the date
        stmt = select(BusinessMetrics).where(BusinessMetrics.metric_date == target_date)
        result = await session.exec(stmt)
        metrics = result.first()
        
        if not metrics:
            metrics = BusinessMetrics(metric_date=target_date)
        
        # Calculate user metrics
        total_users_stmt = select(func.count(User.id))
        total_users_result = await session.exec(total_users_stmt)
        metrics.total_users = total_users_result.one()
        
        # New users today
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        
        new_users_stmt = select(func.count(User.id)).where(
            and_(
                User.created_at >= start_of_day,
                User.created_at <= end_of_day
            )
        )
        new_users_result = await session.exec(new_users_stmt)
        metrics.new_users = new_users_result.one()
        
        # Active users (logged in within last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_daily_stmt = select(func.count(User.id)).where(
            User.last_login_at >= yesterday
        )
        active_daily_result = await session.exec(active_daily_stmt)
        metrics.active_users_daily = active_daily_result.one()
        
        # Active users weekly
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_weekly_stmt = select(func.count(User.id)).where(
            User.last_login_at >= week_ago
        )
        active_weekly_result = await session.exec(active_weekly_stmt)
        metrics.active_users_weekly = active_weekly_result.one()
        
        # Active users monthly
        month_ago = datetime.utcnow() - timedelta(days=30)
        active_monthly_stmt = select(func.count(User.id)).where(
            User.last_login_at >= month_ago
        )
        active_monthly_result = await session.exec(active_monthly_stmt)
        metrics.active_users_monthly = active_monthly_result.one()
        
        # Company metrics
        total_companies_stmt = select(func.count(Company.id))
        total_companies_result = await session.exec(total_companies_stmt)
        metrics.total_companies = total_companies_result.one()
        
        new_companies_stmt = select(func.count(Company.id)).where(
            and_(
                Company.created_at >= start_of_day,
                Company.created_at <= end_of_day
            )
        )
        new_companies_result = await session.exec(new_companies_stmt)
        metrics.new_companies = new_companies_result.one()
        
        # Workspace metrics
        total_workspaces_stmt = select(func.count(Workspace.id))
        total_workspaces_result = await session.exec(total_workspaces_stmt)
        metrics.total_workspaces = total_workspaces_result.one()
        
        # Integration metrics
        total_integrations_stmt = select(func.count(Integration.id))
        total_integrations_result = await session.exec(total_integrations_stmt)
        metrics.total_integrations = total_integrations_result.one()
        
        # Onboarding metrics
        onboarding_started_stmt = select(func.count(OnboardingState.id)).where(
            and_(
                OnboardingState.created_at >= start_of_day,
                OnboardingState.created_at <= end_of_day
            )
        )
        onboarding_started_result = await session.exec(onboarding_started_stmt)
        metrics.onboarding_started = onboarding_started_result.one()
        
        onboarding_completed_stmt = select(func.count(OnboardingState.id)).where(
            and_(
                OnboardingState.is_completed == True,
                OnboardingState.updated_at >= start_of_day,
                OnboardingState.updated_at <= end_of_day
            )
        )
        onboarding_completed_result = await session.exec(onboarding_completed_stmt)
        metrics.onboarding_completed = onboarding_completed_result.one()
        
        # Calculate completion rate
        total_onboarding_stmt = select(func.count(OnboardingState.id))
        total_onboarding_result = await session.exec(total_onboarding_stmt)
        total_onboarding = total_onboarding_result.one()
        
        completed_onboarding_stmt = select(func.count(OnboardingState.id)).where(
            OnboardingState.is_completed == True
        )
        completed_onboarding_result = await session.exec(completed_onboarding_stmt)
        completed_onboarding = completed_onboarding_result.one()
        
        if total_onboarding > 0:
            metrics.onboarding_completion_rate = (completed_onboarding / total_onboarding) * 100
        
        metrics.updated_at = datetime.utcnow()
        
        try:
            session.add(metrics)
            await session.commit()
            await session.refresh(metrics)
        except Exception as e:
            await session.rollback()
            logger.warning(f"Race condition in calculate_business_metrics for {target_date}: {e}")
            stmt = select(BusinessMetrics).where(BusinessMetrics.metric_date == target_date)
            res = await session.exec(stmt)
            existing = res.first()
            if existing:
                for key, val in metrics.dict(exclude={"id", "created_at"}).items():
                    setattr(existing, key, val)
                existing.updated_at = datetime.utcnow()
                session.add(existing)
                await session.commit()
                metrics = existing
        
        return metrics
    
    @staticmethod
    async def get_overview_metrics(session: AsyncSession) -> Dict[str, Any]:
        """Get overview metrics for the control tower dashboard"""
        
        today = date.today()
        
        # Get or calculate today's business metrics
        business_metrics = await MetricsService.calculate_business_metrics(session, today)
        
        # Get recent audit trail activity
        recent_activity_stmt = select(AuditTrail).order_by(
            AuditTrail.created_at.desc()
        ).limit(10)
        recent_activity_result = await session.exec(recent_activity_stmt)
        recent_activity = recent_activity_result.all()
        
        # Calculate growth trends (compare to yesterday)
        yesterday = today - timedelta(days=1)
        yesterday_stmt = select(BusinessMetrics).where(BusinessMetrics.metric_date == yesterday)
        yesterday_result = await session.exec(yesterday_stmt)
        yesterday_metrics = yesterday_result.first()
        
        user_growth = 0
        company_growth = 0
        if yesterday_metrics:
            user_growth = business_metrics.total_users - yesterday_metrics.total_users
            company_growth = business_metrics.total_companies - yesterday_metrics.total_companies
        
        return {
            "total_users": business_metrics.total_users,
            "active_users_daily": business_metrics.active_users_daily,
            "active_users_weekly": business_metrics.active_users_weekly,
            "active_users_monthly": business_metrics.active_users_monthly,
            "total_companies": business_metrics.total_companies,
            "total_workspaces": business_metrics.total_workspaces,
            "total_integrations": business_metrics.total_integrations,
            "onboarding_completion_rate": business_metrics.onboarding_completion_rate,
            "user_growth_today": user_growth,
            "company_growth_today": company_growth,
            "recent_activity": [
                {
                    "id": str(log.id),
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "actor_id": log.actor_id,
                    "created_at": log.created_at.isoformat(),
                    "event_data": log.event_data
                }
                for log in recent_activity
            ]
        }
    
    @staticmethod
    async def get_customer_list(
        session: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get list of customers with their metrics"""
        
        # Get companies with their related data
        stmt = select(Company).offset(offset).limit(limit)
        result = await session.exec(stmt)
        companies = result.all()
        
        customer_list = []
        for company in companies:
            # Get company members
            members_stmt = select(func.count(CompanyMembership.id)).where(
                CompanyMembership.company_id == company.id
            )
            members_result = await session.exec(members_stmt)
            member_count = members_result.one()
            
            # Get brands
            brands_stmt = select(func.count(Brand.id)).where(
                Brand.company_id == company.id
            )
            brands_result = await session.exec(brands_stmt)
            brand_count = brands_result.one()
            
            # Get workspaces
            workspaces_stmt = select(func.count(Workspace.id)).where(
                Workspace.company_id == company.id
            )
            workspaces_result = await session.exec(workspaces_stmt)
            workspace_count = workspaces_result.one()
            
            # Get integrations count
            integrations_stmt = select(func.count(Integration.id)).where(
                Integration.workspace_id.in_(
                    select(Workspace.id).where(Workspace.company_id == company.id)
                )
            )
            integrations_result = await session.exec(integrations_stmt)
            integration_count = integrations_result.one()
            
            # Calculate health score (simple formula)
            health_score = 0
            if member_count > 0:
                health_score += 25
            if brand_count > 0:
                health_score += 25
            if workspace_count > 0:
                health_score += 25
            if integration_count > 0:
                health_score += 25
            
            customer_list.append({
                "id": str(company.id),
                "name": company.brand_name,
                "currency": company.currency,
                "created_at": company.created_at.isoformat(),
                "member_count": member_count,
                "brand_count": brand_count,
                "workspace_count": workspace_count,
                "integration_count": integration_count,
                "health_score": health_score
            })
        
        return customer_list
