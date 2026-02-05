"""
Insight Deduplicator: Prevents showing overlapping insights.

Purpose:
- Detect SKU overlap between insights
- Keep higher-impact insight when overlap > 70%
- Ensure diverse, non-redundant insight deck
"""

from typing import List, Set

from loguru import logger

from app.services.intelligence.base_generator import InsightObject


class InsightDeduplicator:
    """
    Removes insights with significant SKU overlap.
    Keeps higher impact_score when conflict detected.
    """
    
    OVERLAP_THRESHOLD = 0.7  # 70% overlap triggers deduplication
    
    def deduplicate(self, insights: List[InsightObject]) -> List[InsightObject]:
        """
        Remove insights with >70% SKU overlap.
        
        Algorithm:
        1. Sort by impact_score (highest first)
        2. Iterate through sorted list
        3. Check overlap with already-selected insights
        4. Keep if overlap < 70%
        """
        if not insights:
            return []
        
        # Sort by impact score (highest first)
        sorted_insights = sorted(
            insights, 
            key=lambda x: x.impact_score, 
            reverse=True
        )
        
        deduplicated = []
        seen_skus: Set[str] = set()
        
        for insight in sorted_insights:
            # Extract SKUs from this insight
            insight_skus = self._extract_skus(insight)
            
            if not insight_skus:
                # No SKU data, always keep
                deduplicated.append(insight)
                continue
            
            # Calculate overlap with already-selected insights
            overlap_count = len(insight_skus & seen_skus)
            overlap_ratio = overlap_count / len(insight_skus) if insight_skus else 0
            
            if overlap_ratio < self.OVERLAP_THRESHOLD:
                # Low overlap, keep it
                deduplicated.append(insight)
                seen_skus.update(insight_skus)
                
                logger.debug(
                    f"Kept {insight.id} (overlap: {overlap_ratio:.1%})",
                    extra={
                        "insight_id": insight.id,
                        "impact_score": insight.impact_score,
                        "overlap_ratio": overlap_ratio,
                        "sku_count": len(insight_skus)
                    }
                )
            else:
                # High overlap, skip
                logger.debug(
                    f"Deduplicated {insight.id} ({overlap_ratio:.0%} overlap)",
                    extra={
                        "insight_id": insight.id,
                        "impact_score": insight.impact_score,
                        "overlap_ratio": overlap_ratio
                    }
                )
        
        return deduplicated
    
    def _extract_skus(self, insight: InsightObject) -> Set[str]:
        """
        Extract all SKUs/items from insight metadata.
        
        Checks multiple possible keys:
        - skus
        - items
        - top_frozen_skus
        - at_risk_skus
        - high_return_skus
        - etc.
        """
        meta = insight.meta
        sku_keys = [
            "skus", "items", "top_frozen_skus", "at_risk_skus", 
            "high_return_skus", "breakout_products", "slow_items",
            "negative_margin_items", "top_whale_profiles"
        ]
        
        all_skus = set()
        
        for key in sku_keys:
            value = meta.get(key)
            if value:
                if isinstance(value, list):
                    # List of SKUs or dicts
                    for item in value:
                        if isinstance(item, str):
                            all_skus.add(item)
                        elif isinstance(item, dict):
                            # Extract SKU from dict
                            sku = item.get("sku") or item.get("id") or item.get("name")
                            if sku:
                                all_skus.add(str(sku))
                elif isinstance(value, str):
                    all_skus.add(value)
        
        return all_skus


# Singleton instance
insight_deduplicator = InsightDeduplicator()
