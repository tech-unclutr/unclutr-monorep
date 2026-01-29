"""
Cross Sell Generator: Detects frequent product pairings (Market Basket Analysis).

Signal: High support/confidence for product pairs
Impact: Medium (5-7) - Revenue expansion
Category: Growth
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from collections import defaultdict
import itertools

from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.integration import Integration
from app.models.company import Workspace

class CrossSellGenerator(BaseInsightGenerator):
    """
    Detects cross-sell opportunities using association rules (Market Basket Analysis).
    
    Logic:
    1. Analyze orders from last 60 days.
    2. Group line items by order_id.
    3. Count pairs of products appearing together.
    4. Calculate 'Support' (Frequency) and 'Confidence' (Likelihood).
    """
    
    ANALYSIS_DAYS = 60
    MIN_PAIR_FREQUENCY = 3  # Minimum number of times pair must appear together
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate cross-sell insight.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=self.ANALYSIS_DAYS)
        
        # 1. Fetch Order Lines
        # We need product names/titles for the output
        stmt = select(
            ShopifyOrder.shopify_order_id,
            ShopifyLineItem.title,
            ShopifyLineItem.quantity
        ).join(
            ShopifyOrder,
            ShopifyLineItem.order_id == ShopifyOrder.id
        ).join(
            Integration,
            ShopifyOrder.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyOrder.shopify_created_at >= cutoff_date,
            ShopifyOrder.financial_status != 'voided',
            ShopifyOrder.shopify_cancelled_at == None
        )
        
        results = (await session.execute(stmt)).all()
        
        if not results:
             return None
             
        # 2. Group by Order
        orders = defaultdict(list)
        for row in results:
            orders[row.shopify_order_id].append(row.title)
            
        # 3. Count Pairs
        pair_counts = defaultdict(int)
        item_counts = defaultdict(int)
        
        for order_id, items in orders.items():
            unique_items = sorted(list(set(items))) # Dedupe items in same order
            
            for item in unique_items:
                item_counts[item] += 1
                
            if len(unique_items) > 1:
                # Generate all pairs
                for pair in itertools.combinations(unique_items, 2):
                    pair_counts[pair] += 1
                    
        # 4. Find Best Pairs
        # Filter by min frequency
        significant_pairs = {k: v for k, v in pair_counts.items() if v >= self.MIN_PAIR_FREQUENCY}
        
        if not significant_pairs:
            return None
            
        # Sort by frequency
        sorted_pairs = sorted(significant_pairs.items(), key=lambda x: x[1], reverse=True)
        top_pair = sorted_pairs[0] # ((Item A, Item B), count)
        
        item_a = top_pair[0][0]
        item_b = top_pair[0][1]
        pair_count = top_pair[1]
        
        # Calculate Confidence: P(B|A) = Count(A & B) / Count(A)
        # We calculate it both ways and take the stronger direction
        conf_a_to_b = pair_count / item_counts[item_a]
        conf_b_to_a = pair_count / item_counts[item_b]
        
        if conf_a_to_b > conf_b_to_a:
            driver = item_a
            accessory = item_b
            confidence = conf_a_to_b
        else:
            driver = item_b
            accessory = item_a
            confidence = conf_b_to_a
            
        # Impact Score based on frequency and confidence
        # High confidence (e.g. > 50%) is valuable
        impact_score = 5.0 + (confidence * 4.0) # Max 9.0
        
        description = f"Customers who buy '{driver}' are {confidence*100:.0f}% likely to buy '{accessory}'."
        
        return InsightObject(
            id="cross_sell_opportunity",
            title="Bundle Opportunity",
            description=description,
            impact_score=round(impact_score, 1),
            trend="up",
            meta={
                "category": "growth",
                "driver_product": driver,
                "attached_product": accessory,
                "frequency": pair_count,
                "confidence": round(confidence, 2),
                "context": f"These items appeared together in {pair_count} orders recently.",
                "recommendation": f"Create a bundle: '{driver}' + '{accessory}' or add post-purchase upsell.",
                "confidence_level": "medium" if confidence < 0.3 else "high"
            }
        )
