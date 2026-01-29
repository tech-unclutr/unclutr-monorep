"""
End-to-end integration tests for metrics API with insights.
Verifies database persistence and API response structure.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import date
from sqlmodel import select

from app.main import app
from app.core.db import async_session_factory
from app.models.brand_metrics import BrandMetrics


@pytest.mark.asyncio
async def test_metrics_endpoint_returns_insights():
    """ACCURACY: /metrics/brand/{id}/overview must include insights in response."""
    # This test requires a real brand_id from your database
    # Replace with actual test brand ID
    brand_id = "bf69769d-d1fc-4d7a-9930-3b92f20500d9"
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/metrics/brand/{brand_id}/overview",
            headers={"Authorization": "Bearer test_token"}  # Add auth if needed
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "heartbeat" in data
        assert "insights" in data["heartbeat"]
        assert isinstance(data["heartbeat"]["insights"], list)


@pytest.mark.asyncio
async def test_insights_persisted_to_database():
    """ACCURACY: Insights must be persisted to brand_metric.insights JSONB column."""
    brand_id = uuid4()
    today = date.today()
    
    async with async_session_factory() as session:
        # Create test brand metric with insights
        test_metric = BrandMetrics(
            brand_id=brand_id,
            metric_date=today,
            total_revenue=10000.0,
            currency="USD",
            active_sources_count=1,
            insights={
                "deck": [
                    {
                        "id": "test_insight",
                        "title": "Test",
                        "description": "Test insight",
                        "impact_score": 5.0,
                        "trend": "neutral",
                        "meta": {}
                    }
                ]
            }
        )
        
        session.add(test_metric)
        await session.commit()
        
        # Retrieve and verify
        stmt = select(BrandMetrics).where(
            BrandMetrics.brand_id == brand_id,
            BrandMetrics.metric_date == today
        )
        
        result = (await session.execute(stmt)).scalars().first()
        
        assert result is not None
        assert "deck" in result.insights
        assert len(result.insights["deck"]) == 1
        assert result.insights["deck"][0]["id"] == "test_insight"
        
        # Cleanup
        await session.delete(result)
        await session.commit()


@pytest.mark.asyncio
async def test_top_insight_only_in_heartbeat():
    """ACCURACY: Only top-1 insight should be in heartbeat response."""
    # This verifies the slicing logic: insights[:1]
    brand_id = "bf69769d-d1fc-4d7a-9930-3b92f20500d9"
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/metrics/brand/{brand_id}/overview",
            headers={"Authorization": "Bearer test_token"}
        )
        
        if response.status_code == 200:
            data = response.json()
            insights = data["heartbeat"]["insights"]
            
            # Should be at most 1 insight
            assert len(insights) <= 1, "Heartbeat should only contain top-1 insight"
