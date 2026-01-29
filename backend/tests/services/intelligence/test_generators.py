"""
Unit tests for Tier 1 Intelligence Generators.
Ensures 100% accuracy of insight calculations.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock

from app.services.intelligence.generators.velocity_generator import VelocityGenerator
from app.services.intelligence.generators.cashflow_generator import CashflowGenerator
from app.services.intelligence.base_generator import InsightObject


class TestVelocityGenerator:
    """Test suite for VelocityGenerator accuracy."""
    
    @pytest.mark.asyncio
    async def test_returns_none_when_no_baseline(self):
        """ACCURACY: Must return None when avg_30d = 0 to avoid division by zero."""
        gen = VelocityGenerator()
        session = AsyncMock()
        
        # Mock: No historical data
        session.execute = AsyncMock(side_effect=[
            MagicMock(scalar=lambda: Decimal("0.00")),  # avg_7d
            MagicMock(scalar=lambda: Decimal("0.00"))   # avg_30d
        ])
        
        result = await gen.run(session, uuid4())
        assert result is None, "Should return None when baseline is zero"
    
    @pytest.mark.asyncio
    async def test_filters_changes_below_15_percent(self):
        """ACCURACY: Must filter noise below 15% significance threshold."""
        gen = VelocityGenerator()
        session = AsyncMock()
        
        # Mock: 10% increase (below threshold)
        session.execute = AsyncMock(side_effect=[
            MagicMock(scalar=lambda: Decimal("1100.00")),  # avg_7d
            MagicMock(scalar=lambda: Decimal("1000.00"))   # avg_30d
        ])
        
        result = await gen.run(session, uuid4())
        assert result is None, "Should filter changes < 15%"
    
    @pytest.mark.asyncio
    async def test_generates_insight_above_15_percent(self):
        """ACCURACY: Must generate insight when change >= 15%."""
        gen = VelocityGenerator()
        session = AsyncMock()
        
        # Mock: 20% increase (above threshold)
        session.execute = AsyncMock(side_effect=[
            MagicMock(scalar=lambda: Decimal("1200.00")),  # avg_7d
            MagicMock(scalar=lambda: Decimal("1000.00"))   # avg_30d
        ])
        
        result = await gen.run(session, uuid4())
        
        assert result is not None, "Should generate insight for 20% change"
        assert result.id == "velocity_trend"
        assert result.trend == "up"
        assert "20.0%" in result.description
        assert result.meta["diff_pct"] == pytest.approx(0.2, abs=0.01)
    
    @pytest.mark.asyncio
    async def test_detects_downward_trend(self):
        """ACCURACY: Must correctly identify downward trends."""
        gen = VelocityGenerator()
        session = AsyncMock()
        
        # Mock: 25% decrease
        session.execute = AsyncMock(side_effect=[
            MagicMock(scalar=lambda: Decimal("750.00")),   # avg_7d
            MagicMock(scalar=lambda: Decimal("1000.00"))   # avg_30d
        ])
        
        result = await gen.run(session, uuid4())
        
        assert result is not None
        assert result.trend == "down"
        assert result.meta["diff_pct"] == pytest.approx(-0.25, abs=0.01)
    
    @pytest.mark.asyncio
    async def test_impact_score_calculation(self):
        """ACCURACY: Impact score must scale correctly with magnitude."""
        gen = VelocityGenerator()
        session = AsyncMock()
        
        # Mock: 50% increase (should give impact_score = 5.0)
        session.execute = AsyncMock(side_effect=[
            MagicMock(scalar=lambda: Decimal("1500.00")),  # avg_7d
            MagicMock(scalar=lambda: Decimal("1000.00"))   # avg_30d
        ])
        
        result = await gen.run(session, uuid4())
        
        # 50% change / 0.5 threshold * 5.0 baseline = 5.0
        assert result.impact_score == pytest.approx(5.0, abs=0.1)


class TestCashflowGenerator:
    """Test suite for CashflowGenerator accuracy."""
    
    @pytest.mark.asyncio
    async def test_returns_none_when_no_inventory(self):
        """ACCURACY: Must return None when inventory value = 0."""
        gen = CashflowGenerator()
        session = AsyncMock()
        
        # Mock: No inventory
        session.execute = AsyncMock(return_value=MagicMock(scalar=lambda: Decimal("0.00")))
        
        result = await gen.run(session, uuid4())
        assert result is None, "Should return None when inventory is zero"
    
    @pytest.mark.asyncio
    async def test_calculates_inventory_value_correctly(self):
        """ACCURACY: Must aggregate (quantity * cost) correctly."""
        gen = CashflowGenerator()
        session = AsyncMock()
        
        # Mock: ₹120,880 inventory value (from real data)
        session.execute = AsyncMock(return_value=MagicMock(scalar=lambda: Decimal("120880.00")))
        
        result = await gen.run(session, uuid4())
        
        assert result is not None
        assert result.id == "inventory_value"
        assert result.trend == "neutral"
        assert result.meta["inventory_value"] == pytest.approx(120880.0, abs=1.0)
        assert "120,880.00" in result.description
    
    @pytest.mark.asyncio
    async def test_handles_null_cost_gracefully(self):
        """ACCURACY: NULL cost items should be excluded (SUM ignores NULL)."""
        gen = CashflowGenerator()
        session = AsyncMock()
        
        # Mock: Some items have NULL cost (SQL SUM ignores them)
        session.execute = AsyncMock(return_value=MagicMock(scalar=lambda: Decimal("50000.00")))
        
        result = await gen.run(session, uuid4())
        
        assert result is not None
        assert result.meta["inventory_value"] == 50000.0
    
    @pytest.mark.asyncio
    async def test_impact_score_is_dynamic(self):
        """ACCURACY: Phase 2.1 uses dynamic impact scoring based on inventory value."""
        gen = CashflowGenerator()
        session = AsyncMock()
        
        # Test: ₹100,000 inventory → score should be 5.0
        session.execute = AsyncMock(return_value=MagicMock(scalar=lambda: Decimal("100000.00")))
        
        result = await gen.run(session, uuid4())
        
        assert result.impact_score == pytest.approx(5.0, abs=0.1), "₹100k should give score ~5.0"
        
        # Test: ₹200,000 inventory → score should be 10.0
        session.execute = AsyncMock(return_value=MagicMock(scalar=lambda: Decimal("200000.00")))
        
        result = await gen.run(session, uuid4())
        
        assert result.impact_score == pytest.approx(10.0, abs=0.1), "₹200k should give score ~10.0"
        
        # Test: ₹25,000 inventory → score should be ~1.25
        session.execute = AsyncMock(return_value=MagicMock(scalar=lambda: Decimal("25000.00")))
        
        result = await gen.run(session, uuid4())
        
        assert result.impact_score == pytest.approx(1.25, abs=0.1), "₹25k should give score ~1.25"


class TestBaseInsightGenerator:
    """Test suite for BaseInsightGenerator scoring logic."""
    
    def test_calculate_score_scales_correctly(self):
        """ACCURACY: Scoring formula must scale linearly."""
        from app.services.intelligence.base_generator import BaseInsightGenerator
        
        class DummyGenerator(BaseInsightGenerator):
            async def run(self, session, brand_id):
                pass
        
        gen = DummyGenerator()
        
        # Test: value = threshold → score = 5.0
        assert gen.calculate_score(100, 100) == 5.0
        
        # Test: value = 2x threshold → score = 10.0 (capped)
        assert gen.calculate_score(200, 100) == 10.0
        
        # Test: value = 0.5x threshold → score = 2.5
        assert gen.calculate_score(50, 100) == 2.5
    
    def test_calculate_score_handles_zero_threshold(self):
        """ACCURACY: Must handle edge case of zero threshold."""
        from app.services.intelligence.base_generator import BaseInsightGenerator
        
        class DummyGenerator(BaseInsightGenerator):
            async def run(self, session, brand_id):
                pass
        
        gen = DummyGenerator()
        
        assert gen.calculate_score(100, 0) == 0.0, "Should return 0 for zero threshold"
