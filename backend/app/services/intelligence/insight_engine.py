import time
from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from loguru import logger

from app.core.feature_flags import feature_flags
from app.core.metrics import (
    generator_errors,
    insight_generation_duration,
    insight_generation_total,
)
from app.models.insight_tracking import InsightGenerationLog
from app.services.intelligence.base_generator import InsightObject
from app.services.intelligence.llm_service import llm_service
from app.services.intelligence.validators import (
    fallback_library,
    insight_deduplicator,
    insight_quality_scorer,
    validator_service,
)


class InsightEngine:
    """
    Phase 3 Intelligence Deck Orchestrator.
    
    Pipeline:
    1. Run all 15 generators
    2. Validate numeric claims
    3. Score quality (freshness, significance, actionability, impact, confidence)
    4. Deduplicate (SKU overlap)
    5. Balance categories (diverse mix)
    6. Log generation history
    """
    
    def __init__(self):
        self.generators = []
        # Lazy load generators on first request to prevent startup crash
        # self._load_generators() 

    def _load_generators(self):
        """
        Loads all 15 Phase 3 generators.
        """
        # Phase 2 Generators
        from app.services.intelligence.generators.cashflow_generator import (
            CashflowGenerator,
        )

        # Financial Generators
        from app.services.intelligence.generators.financial import (
            AdWasteGenerator,
            FrozenCashGenerator,
            MarginCrusherGenerator,
            SlowMoverGenerator,
            StockoutRiskGenerator,
        )

        # Growth Generators
        from app.services.intelligence.generators.growth import (
            CrossSellGenerator,
            GeoSpikeGenerator,
            RelativeWhaleGenerator,
            VelocityBreakoutGenerator,
            VIPAtRiskGenerator,
        )

        # Operational Generators
        from app.services.intelligence.generators.operational import (
            DiscountAbuseGenerator,
            FulfillmentBottleneckGenerator,
            IntegrationHealthGenerator,
            LeakingBucketGenerator,
            RefundAnomalyGenerator,
        )
        from app.services.intelligence.generators.velocity_generator import (
            VelocityGenerator,
        )
        
        self.generators = [
            # Phase 2 (keep for backward compatibility)
            VelocityGenerator(),
            CashflowGenerator(),
            
            # Financial Intelligence
            FrozenCashGenerator(),
            StockoutRiskGenerator(),
            MarginCrusherGenerator(),
            SlowMoverGenerator(),
            AdWasteGenerator(),
            
            # Growth Intelligence
            VIPAtRiskGenerator(),
            VelocityBreakoutGenerator(),
            RelativeWhaleGenerator(),
            CrossSellGenerator(),
            GeoSpikeGenerator(),
            
            # Operational Intelligence
            LeakingBucketGenerator(),
            RefundAnomalyGenerator(),
            FulfillmentBottleneckGenerator(),
            DiscountAbuseGenerator(),
            IntegrationHealthGenerator()
        ]
        
        logger.info(f"Loaded {len(self.generators)} generators")

    async def generate_deck(self, session, brand_id: UUID) -> List[Dict[str, Any]]:
        """
        Legacy method - returns top insight only (Phase 2 compatibility).
        """
        full_deck = await self.generate_full_deck(session, brand_id)
        return full_deck.get("insights", [])[:1]  # Return top 1 for backward compatibility

    async def generate_full_deck(self, session, brand_id: UUID) -> Dict[str, Any]:
        """
        Phase 3: Generate complete 15-card deck with validation and enrichment.
        
        Pipeline:
        1. Run all 15 generators
        2. Validate numeric claims
        3. Score quality
        4. Deduplicate
        5. Balance categories
        6. Log generation
        
        Returns:
            {
                "insights": [...],  # Top 5 balanced insights
                "full_deck": [...],  # All insights
                "category_distribution": {...},
                "generation_time_ms": 123,
                "generated_at": "2024-01-15T..."
            }
        """
        # Feature flag check
            insight_generation_total.labels(brand_id=str(brand_id), status="disabled").inc()
            return {
                "insights": [],
                "full_deck": [],
                "category_distribution": {},
                "generation_time_ms": 0,
                "generated_at": datetime.utcnow().isoformat()
            }
        
        # Lazy Load
        if not self.generators:
            logger.info("First run: Lazy loading generators...")
            self._load_generators()

        start_time = time.time()
        logger.info(f"Generating full insight deck for brand_id={brand_id}")
        
        # Step 1: Run all generators
        raw_insights = await self._run_generators(session, brand_id)
        
        # Calculate health metrics
        total_gens = len(self.generators)
        # Assuming _run_generators returns only successful insights, but we need to know how many *tried* vs *succeeded*
        # Actually _run_generators logs errors. Let's make it return (insights, success_count) or just infer from logs?
        # Simpler: Just count how many insights we got vs expected, but some validly return None.
        # Better: use the metrics we explicitly tracked or just trust that if we have > 5 insights, we are healthy.
        
        # Let's trust the "Healthy" status if we have enough insights to show a carousel.
        
        # Step 2: Validate numeric claims
        validated_insights = await self._validate_insights(raw_insights)

        # Step 3: LLM Enrichment (Context + Recommendations)
        # Using "Self-Healing" via validation+retry inside LLM service if needed
        enriched_insights = await self._enrich_insights(validated_insights)
        
        # Step 4: Quality scoring
        quality_filtered = await self._score_quality(enriched_insights, session)
        
        # Step 5: Deduplication
        deduplicated = self._deduplicate_insights(quality_filtered)
        
        # Step 6: Category balancing (top 5)
        balanced_top_5 = self._balance_categories(deduplicated)

        # Step 7: Morning Briefing (Personalized)
        # Assuming brand owner name is fetched or default to "Owner"
        # In real app, we'd fetch the user's name from context or user service
        briefing = await llm_service.generate_morning_briefing("Partner", balanced_top_5)
        
        # Step 8: Log generation
        generation_time_ms = (time.time() - start_time) * 1000
        await self._log_generation(session, brand_id, deduplicated, generation_time_ms)
        
        # Track metrics
        insight_generation_total.labels(
            brand_id=str(brand_id),
            status="success" if deduplicated else "empty"
        ).inc()
        
        insight_generation_duration.labels(brand_id=str(brand_id), generator="total").observe(generation_time_ms / 1000)
        
        logger.info(
            "Full deck generated",
            extra={
                "brand_id": str(brand_id),
                "total_insights": len(deduplicated),
                "top_5_count": len(balanced_top_5),
                "duration_ms": generation_time_ms
            }
        )
        
        return {
            "insights": [i.dict() for i in balanced_top_5],
            "full_deck": [i.dict() for i in deduplicated],
            "briefing": briefing,
            "category_distribution": self._count_categories(balanced_top_5),
            "generation_time_ms": round(generation_time_ms, 2),
            "generated_at": datetime.utcnow().isoformat(),
            "system_health": {
                "total_generators": len(self.generators),
                "active_insights": len(deduplicated),
                "status": "degraded" if len(deduplicated) < 3 else "healthy"
            }
        }
    
    async def _run_generators(self, session, brand_id: UUID) -> List[InsightObject]:
        """
        Step 1: Run all generators and collect insights.
        """
        insights = []
        
        for gen in self.generators:
            gen_start = time.time()
            gen_name = gen.__class__.__name__
            
            try:
                insight = await gen.run(session, brand_id)
                gen_duration = time.time() - gen_start
                
                if insight:
                    insights.append(insight)
            except Exception as e:
                error_type = type(e).__name__
                generator_errors.labels(generator=gen_name, error_type=error_type).inc()
                logger.error(
                    f"Generator {gen_name} failed: {e}",
                    extra={"brand_id": str(brand_id), "error_type": error_type}
                )
        
        return insights
    
    async def _validate_insights(self, insights: List[InsightObject]) -> List[InsightObject]:
        """
        Step 2: Validate numeric claims against source metrics.
        Apply fallback templates if validation fails.
        """
        validated = []
        
        for insight in insights:
            validation = validator_service.validate_insight(
                insight.description,
                insight.meta
            )
            
            if not validation.passed:
                # Attempt Self-Healing with LLM
                logger.warning(f"Insight {insight.id} failed validation. Attempting Self-Healing...")
                
                try:
                    fixed_description = await llm_service.validate_and_fix(
                        insight.description,
                        insight.meta,
                        validation.error
                    )
                    
                    # Validate again
                    re_validation = validator_service.validate_insight(fixed_description, insight.meta)
                    
                    if re_validation.passed:
                        logger.info(f"Self-Healing successful for {insight.id}")
                        insight.description = fixed_description
                        insight.meta["self_healed"] = True
                    else:
                        raise ValueError(f"Self-Healing failed: {re_validation.error}")
                        
                except Exception as e:
                    # Final Fail: Apply fallback template
                    logger.warning(
                        f"Validation final failure for {insight.id}: {e}",
                        extra={"hallucinated_numbers": validation.hallucinated_numbers}
                    )
                    
                    safe_description = fallback_library.apply_template(
                        insight.id,
                        insight.meta
                    )
                    insight.description = safe_description
                    insight.meta["validation_failed"] = True
                    insight.meta["confidence"] = "low"
            
            validated.append(insight)
        
        return validated

    async def _enrich_insights(self, insights: List[InsightObject]) -> List[InsightObject]:
        """
        Step 3: Enrich insights with LLM Context and Recommendations (Parallel).
        """
        import asyncio
        
        # We process all insights in parallel to minimize latency
        async def enrich_one(insight):
            try:
                # Parallel context + recs
                context_task = llm_service.enrich_context(insight)
                recs_task = llm_service.generate_recommendations(insight)
                
                context, recs = await asyncio.gather(context_task, recs_task)
                
                if context:
                    insight.meta["llm_context"] = context
                if recs:
                    insight.meta["llm_recommendations"] = recs
                    
                return insight
            except Exception as e:
                logger.error(f"Enrichment error for {insight.id}: {e}")
                return insight # Return original if enrichment fails

        # Gather all tasks
        tasks = [enrich_one(i) for i in insights]
        enriched = await asyncio.gather(*tasks)
        
        return list(enriched)
    
    async def _score_quality(
        self, 
        insights: List[InsightObject],
        session
    ) -> List[InsightObject]:
        """
        Step 3: Score quality and filter low-quality insights.
        """
        quality_filtered = []
        
        for insight in insights:
            quality = await insight_quality_scorer.score(insight, session)
            insight.meta["quality_score"] = round(quality.composite_score(), 2)
            
            if insight_quality_scorer.should_show(quality):
                quality_filtered.append(insight)
        
        return quality_filtered
    
    def _deduplicate_insights(self, insights: List[InsightObject]) -> List[InsightObject]:
        """
        Step 4: Remove insights with >70% SKU overlap.
        """
        return insight_deduplicator.deduplicate(insights)
    
    def _balance_categories(self, insights: List[InsightObject]) -> List[InsightObject]:
        """
        Step 5: Ensure diverse category mix in top 5.
        
        Algorithm:
        - Pick top 1 from each category (financial, growth, operational)
        - Fill remaining slots with highest impact (max 2 per category)
        """
        if len(insights) <= 5:
            return insights
        
        # Group by category
        categories = {"financial": [], "growth": [], "operational": []}
        
        for insight in insights:
            cat = insight.meta.get("category", "operational")
            categories[cat].append(insight)
        
        # Sort each category by impact
        for cat in categories:
            categories[cat].sort(key=lambda x: x.impact_score, reverse=True)
        
        balanced = []
        
        # Round 1: Pick top 1 from each category
        for cat in ["financial", "growth", "operational"]:
            if categories[cat]:
                balanced.append(categories[cat].pop(0))
        
        # Round 2: Fill remaining slots (max 2 per category)
        all_remaining = []
        for cat in categories.values():
            all_remaining.extend(cat)
        all_remaining.sort(key=lambda x: x.impact_score, reverse=True)
        
        for insight in all_remaining:
            if len(balanced) >= 5:
                break
            
            cat = insight.meta.get("category")
            cat_count = sum(1 for i in balanced if i.meta.get("category") == cat)
            
            if cat_count < 2:
                balanced.append(insight)
        
        return balanced[:5]
    
    def _count_categories(self, insights: List[InsightObject]) -> Dict[str, int]:
        """
        Count insights by category.
        """
        counts = {"financial": 0, "growth": 0, "operational": 0}
        for insight in insights:
            cat = insight.meta.get("category", "operational")
            counts[cat] += 1
        return counts
    
    async def _log_generation(
        self,
        session,
        brand_id: UUID,
        insights: List[InsightObject],
        generation_time_ms: float
    ):
        """
        Step 6: Log generation to database for historical tracking.
        """
        try:
            log = InsightGenerationLog(
                brand_id=brand_id,
                generated_at=datetime.utcnow(),
                insights=[i.dict() for i in insights],
                generation_time_ms=int(generation_time_ms),
                validation_failures=[
                    i.id for i in insights 
                    if i.meta.get("validation_failed")
                ]
            )
            session.add(log)
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to log generation: {e}")


# Singleton instance
insight_engine = InsightEngine()
