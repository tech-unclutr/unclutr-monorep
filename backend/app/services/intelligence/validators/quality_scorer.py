"""
Insight Quality Scorer: Multi-dimensional quality assessment.

Purpose:
- Score insights on 5 dimensions (0-10 each)
- Gate low-quality insights (composite score < 6.0)
- Ensure only actionable, significant insights reach users
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.intelligence.base_generator import InsightObject


@dataclass
class QualityScore:
    """Multi-dimensional quality score"""
    data_freshness: float  # 0-10
    statistical_significance: float  # 0-10
    actionability: float  # 0-10
    business_impact: float  # 0-10
    confidence: float  # 0-10
    
    def composite_score(self) -> float:
        """
        Calculate weighted composite score.
        
        Weights:
        - Freshness: 20%
        - Significance: 20%
        - Actionability: 30% (most important)
        - Impact: 20%
        - Confidence: 10%
        """
        return (
            self.data_freshness * 0.2 +
            self.statistical_significance * 0.2 +
            self.actionability * 0.3 +
            self.business_impact * 0.2 +
            self.confidence * 0.1
        )


class InsightQualityScorer:
    """
    Scores insights on multiple quality dimensions.
    Only insights with composite score > 6.0 are shown.
    """
    
    QUALITY_THRESHOLD = 6.0
    
    async def score(
        self, 
        insight: InsightObject, 
        session: Optional[AsyncSession] = None
    ) -> QualityScore:
        """
        Score insight on all dimensions.
        """
        return QualityScore(
            data_freshness=await self._score_freshness(insight, session) if session else 8.0,
            statistical_significance=self._score_significance(insight),
            actionability=self._score_actionability(insight),
            business_impact=min(insight.impact_score, 10.0),
            confidence=self._parse_confidence(insight.meta.get("confidence", "medium"))
        )
    
    async def _score_freshness(
        self, 
        insight: InsightObject, 
        session: AsyncSession
    ) -> float:
        """
        Score data freshness.
        
        10 = data < 1 hour old
        5 = data < 24 hours old
        0 = data > 7 days old
        """
        # Check last sync time for related integration
        # For now, assume recent data (would query integration.last_sync_at in production)
        
        # Placeholder: assume data is fresh
        return 9.0
    
    def _score_significance(self, insight: InsightObject) -> float:
        """
        Score statistical significance.
        
        10 = p-value < 0.01 or z-score > 3
        7 = p-value < 0.05 or z-score > 2
        5 = default (moderate confidence)
        0 = no statistical validation
        """
        meta = insight.meta
        
        # Check for p-value
        p_value = meta.get("p_value")
        if p_value is not None:
            if p_value < 0.01:
                return 10.0
            elif p_value < 0.05:
                return 7.0
            else:
                return 5.0
        
        # Check for z-score
        z_score = meta.get("z_score")
        if z_score is not None:
            abs_z = abs(z_score)
            if abs_z > 3:
                return 10.0
            elif abs_z > 2:
                return 8.0
            elif abs_z > 1:
                return 6.0
            else:
                return 4.0
        
        # Check for sample size
        sample_size = meta.get("sample_size") or meta.get("days_analyzed") or meta.get("order_count")
        if sample_size:
            if sample_size >= 100:
                return 8.0
            elif sample_size >= 30:
                return 6.0
            elif sample_size >= 10:
                return 5.0
            else:
                return 3.0
        
        # Default: moderate confidence
        return 5.0
    
    def _score_actionability(self, insight: InsightObject) -> float:
        """
        Score actionability.
        
        10 = Has specific SKUs + recommendations + timeline
        5 = Has general recommendations
        0 = No actionable information
        """
        meta = insight.meta
        score = 0.0
        
        # Has specific SKUs/items (3 points)
        if any(k in meta for k in ["skus", "items", "top_frozen_skus", "at_risk_skus", "high_return_skus"]):
            items = meta.get("skus") or meta.get("items") or meta.get("top_frozen_skus") or meta.get("at_risk_skus") or meta.get("high_return_skus")
            if items and len(items) > 0:
                score += 3.0
        
        # Has recommendations (4 points)
        if any(k in meta for k in ["recommendation", "recommendations", "llm_recommendations"]):
            rec = meta.get("recommendation") or meta.get("recommendations") or meta.get("llm_recommendations")
            if rec:
                score += 4.0
        
        # Has timeline/urgency (3 points)
        if any(k in meta for k in ["days_remaining", "deadline", "urgency", "days_until_stockout", "avg_days_frozen"]):
            score += 3.0
        
        return min(score, 10.0)
    
    def _parse_confidence(self, confidence: str) -> float:
        """
        Convert confidence string to 0-10 score.
        """
        mapping = {
            "high": 10.0,
            "medium": 6.0,
            "low": 3.0
        }
        return mapping.get(confidence, 5.0)
    
    def should_show(self, quality: QualityScore) -> bool:
        """
        Determine if insight should be shown based on quality.
        
        Threshold: composite score > 6.0
        """
        return quality.composite_score() > self.QUALITY_THRESHOLD


# Singleton instance
insight_quality_scorer = InsightQualityScorer()
