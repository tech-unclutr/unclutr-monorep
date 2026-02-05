"""
Integration Health Generator: Detects sync failures and stale data.

Signal: Sync failures or data > 6 hours old
Impact: Critical (9-10) - data integrity
Category: Operational
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Workspace
from app.models.datasource import DataSource
from app.models.integration import Integration
from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject


class IntegrationHealthGenerator(BaseInsightGenerator):
    """
    Monitors integration health (sync status, data freshness).
    
    Critical for data integrity.
    """
    
    STALENESS_THRESHOLD_HOURS = 6
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate integration health insight.
        """
        logger.debug(f"IntegrationHealth: Starting analysis for brand_id={brand_id}")
        
        # Get all integrations for this brand
        stmt = select(
            Integration,
            DataSource.name.label("platform_name")
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).join(
            DataSource,
            Integration.datasource_id == DataSource.id
        ).where(
            Workspace.brand_id == brand_id,
            Integration.status == 'active'
        )
        
        results = (await session.execute(stmt)).all()
        
        if not results:
            logger.info("IntegrationHealth: No active integrations")
            return None
        
        # Check for issues
        failing_integrations = []
        stale_integrations = []
        
        staleness_threshold = datetime.now(timezone.utc) - timedelta(hours=self.STALENESS_THRESHOLD_HOURS)
        
        for integration, platform_name in results:
            # Check sync status
            if integration.error_message:
                failing_integrations.append({
                    "name": platform_name,
                    "error": integration.error_message,
                    "last_sync": integration.last_sync_at.isoformat() if integration.last_sync_at else None
                })
            
            # Check data freshness
            if integration.last_sync_at and integration.last_sync_at < staleness_threshold:
                hours_stale = (datetime.now(timezone.utc) - integration.last_sync_at).total_seconds() / 3600
                stale_integrations.append({
                    "name": platform_name,
                    "hours_stale": round(hours_stale, 1),
                    "last_sync": integration.last_sync_at.isoformat()
                })
        
        if not failing_integrations and not stale_integrations:
            logger.info("IntegrationHealth: All integrations healthy")
            return None
        
        # Calculate metrics
        total_issues = len(failing_integrations) + len(stale_integrations)
        max_staleness = max([i["hours_stale"] for i in stale_integrations]) if stale_integrations else 0
        
        # Impact score (9-10 for critical)
        impact_score = 10.0 if failing_integrations else 9.0
        
        # Build description
        if failing_integrations and stale_integrations:
            description = f"{len(failing_integrations)} integrations have sync failures (data {int(max_staleness)} hours stale)."
        elif failing_integrations:
            description = f"{len(failing_integrations)} integrations have sync failures."
        else:
            description = f"{len(stale_integrations)} integrations have stale data ({int(max_staleness)} hours old)."
        
        # Context
        context = "Data integrity at risk - insights may be inaccurate"
        
        # Recommendation
        recommendation = "Check integration settings and re-authenticate immediately"
        
        return InsightObject(
            id="integration_health",
            title="Integration Health Alert",
            description=description,
            impact_score=round(impact_score, 1),
            trend="down",
            meta={
                "category": "operational",
                "failing_integrations": len(failing_integrations),
                "stale_integrations": len(stale_integrations),
                "data_staleness_hours": round(max_staleness, 1),
                "error_messages": [f["error"] for f in failing_integrations],
                "affected_platforms": [f["name"] for f in failing_integrations + stale_integrations],
                "context": context,
                "recommendation": recommendation,
                "confidence": "high",
                "methodology": "sync_monitoring_v1"
            }
        )
