"""
Integration tests for InsightEngine orchestration.
Verifies end-to-end insight generation and sorting.
"""
import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.intelligence.insight_engine import InsightEngine, insight_engine
from app.services.intelligence.base_generator import InsightObject


class TestInsightEngine:
    """Test suite for InsightEngine orchestration."""
    
    @pytest.mark.asyncio
    async def test_sorts_deck_by_impact_score_descending(self):
        """ACCURACY: Deck must be sorted by impact_score (high to low)."""
        engine = InsightEngine()
        session = AsyncMock()
        brand_id = uuid4()
        
        # Mock generators returning insights with different scores
        mock_gen1 = AsyncMock()
        mock_gen1.run = AsyncMock(return_value=InsightObject(
            id="low_impact",
            title="Low Impact",
            description="Test",
            impact_score=3.0,
            trend="neutral"
        ))
        
        mock_gen2 = AsyncMock()
        mock_gen2.run = AsyncMock(return_value=InsightObject(
            id="high_impact",
            title="High Impact",
            description="Test",
            impact_score=8.0,
            trend="up"
        ))
        
        mock_gen3 = AsyncMock()
        mock_gen3.run = AsyncMock(return_value=InsightObject(
            id="medium_impact",
            title="Medium Impact",
            description="Test",
            impact_score=5.0,
            trend="down"
        ))
        
        engine.generators = [mock_gen1, mock_gen2, mock_gen3]
        
        deck = await engine.generate_deck(session, brand_id)
        
        assert len(deck) == 3
        assert deck[0]["id"] == "high_impact", "Highest impact should be first"
        assert deck[1]["id"] == "medium_impact"
        assert deck[2]["id"] == "low_impact"
        assert deck[0]["impact_score"] == 8.0
        assert deck[1]["impact_score"] == 5.0
        assert deck[2]["impact_score"] == 3.0
    
    @pytest.mark.asyncio
    async def test_filters_none_results(self):
        """ACCURACY: None results from generators must be excluded."""
        engine = InsightEngine()
        session = AsyncMock()
        brand_id = uuid4()
        
        # Mock: Some generators return None
        mock_gen1 = AsyncMock()
        mock_gen1.run = AsyncMock(return_value=None)
        
        mock_gen2 = AsyncMock()
        mock_gen2.run = AsyncMock(return_value=InsightObject(
            id="valid",
            title="Valid",
            description="Test",
            impact_score=5.0
        ))
        
        mock_gen3 = AsyncMock()
        mock_gen3.run = AsyncMock(return_value=None)
        
        engine.generators = [mock_gen1, mock_gen2, mock_gen3]
        
        deck = await engine.generate_deck(session, brand_id)
        
        assert len(deck) == 1, "Should only include non-None results"
        assert deck[0]["id"] == "valid"
    
    @pytest.mark.asyncio
    async def test_handles_generator_exceptions(self):
        """ACCURACY: Generator exceptions must not crash the engine."""
        engine = InsightEngine()
        session = AsyncMock()
        brand_id = uuid4()
        
        # Mock: One generator throws exception
        mock_gen1 = AsyncMock()
        mock_gen1.run = AsyncMock(side_effect=Exception("Database error"))
        mock_gen1.__class__.__name__ = "FailingGenerator"
        
        mock_gen2 = AsyncMock()
        mock_gen2.run = AsyncMock(return_value=InsightObject(
            id="valid",
            title="Valid",
            description="Test",
            impact_score=5.0
        ))
        
        engine.generators = [mock_gen1, mock_gen2]
        
        deck = await engine.generate_deck(session, brand_id)
        
        assert len(deck) == 1, "Should continue despite exception"
        assert deck[0]["id"] == "valid"
    
    @pytest.mark.asyncio
    async def test_returns_empty_deck_when_all_none(self):
        """ACCURACY: Empty deck when all generators return None."""
        engine = InsightEngine()
        session = AsyncMock()
        brand_id = uuid4()
        
        mock_gen1 = AsyncMock()
        mock_gen1.run = AsyncMock(return_value=None)
        
        mock_gen2 = AsyncMock()
        mock_gen2.run = AsyncMock(return_value=None)
        
        engine.generators = [mock_gen1, mock_gen2]
        
        deck = await engine.generate_deck(session, brand_id)
        
        assert deck == [], "Should return empty list"
    
    def test_singleton_instance_exists(self):
        """ACCURACY: insight_engine singleton must be initialized."""
        assert insight_engine is not None
        assert isinstance(insight_engine, InsightEngine)
        assert len(insight_engine.generators) == 2, "Should have 2 Tier 1 generators"
