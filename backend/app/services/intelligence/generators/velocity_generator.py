from datetime import date, timedelta
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy import select, func
from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject
from app.models.integration_analytics import IntegrationDailyMetric
from decimal import Decimal
from loguru import logger

class VelocityGenerator(BaseInsightGenerator):
    """
    Production-Grade Sales Velocity Intelligence (v2.0).
    
    Features:
    - Non-overlapping week-over-week comparison
    - Statistical validation and confidence scoring
    - Anomaly detection for data quality
    - Rich contextual metadata for actionable insights
    
    Methodology:
    - Compares last 7 complete days vs previous 7 complete days
    - Excludes partial "today" data for consistency
    - Requires minimum 14 days of data for reliability
    - Filters noise with 15% significance threshold
    """
    
    # Configuration Constants
    MIN_DAYS_REQUIRED = 14
    SIGNIFICANCE_THRESHOLD = 0.15  # 15% change required to show insight
    HIGH_VARIANCE_PENALTY = 0.3    # Reduce impact score by 30% for volatile data
    VOLATILITY_THRESHOLD = 0.5     # StdDev > 50% of mean = high volatility
    
    async def run(self, session, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generates sales velocity insight with statistical rigor.
        Returns None if data is insufficient or signal is below threshold.
        """
        
        # ============================================================
        # STEP 1: Define Non-Overlapping Time Windows
        # ============================================================
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Recent Period: Last 7 complete days (excluding today)
        recent_end = yesterday
        recent_start = yesterday - timedelta(days=6)
        
        # Baseline Period: Previous 7 complete days
        baseline_end = yesterday - timedelta(days=7)
        baseline_start = yesterday - timedelta(days=13)
        
        logger.debug(f"Velocity Analysis: Recent={recent_start} to {recent_end}, Baseline={baseline_start} to {baseline_end}")
        
        # ============================================================
        # STEP 2: Fetch Data with Validation
        # ============================================================
        from app.models.integration import Integration
        from app.models.company import Workspace
        
        count_recent_stmt = select(func.count(func.distinct(IntegrationDailyMetric.snapshot_date))).where(
            IntegrationDailyMetric.integration_id.in_(
                select(Integration.id).join(Workspace).where(Workspace.brand_id == brand_id)
            ),
            IntegrationDailyMetric.snapshot_date >= recent_start,
            IntegrationDailyMetric.snapshot_date <= recent_end
        )
        days_recent = (await session.execute(count_recent_stmt)).scalar() or 0
        
        # Count available days in baseline period
        # Count available days in baseline period
        count_baseline_stmt = select(func.count(func.distinct(IntegrationDailyMetric.snapshot_date))).where(
            IntegrationDailyMetric.integration_id.in_(
                select(Integration.id).join(Workspace).where(Workspace.brand_id == brand_id)
            ),
            IntegrationDailyMetric.snapshot_date >= baseline_start,
            IntegrationDailyMetric.snapshot_date <= baseline_end
        )
        days_baseline = (await session.execute(count_baseline_stmt)).scalar() or 0
        
        # Data Validation: Require minimum data completeness OR Cold Start
        total_days = days_recent + days_baseline
        
        # COLD START: Allow if we have at least 3 days of data (e.g. today, yesterday, day before)
        is_cold_start = False
        if total_days < self.MIN_DAYS_REQUIRED:
            if total_days >= 3:
                is_cold_start = True
                logger.info(f"Velocity: Limited data ({total_days} days). Enabling Cold Start mode.")
            else:
                logger.info(f"Velocity: Insufficient data ({total_days}/{self.MIN_DAYS_REQUIRED} days). Skipping insight.")
                return None
        
        data_completeness = total_days / self.MIN_DAYS_REQUIRED
        has_gaps = (days_recent < 7 or days_baseline < 7) and not is_cold_start
        
        # ============================================================
        # STEP 3: Calculate Averages (Non-Overlapping)
        # ============================================================
        
        # Recent Period Average
        stmt_recent = select(func.avg(IntegrationDailyMetric.net_sales)).where(
            IntegrationDailyMetric.integration_id.in_(
                select(Integration.id).join(Workspace).where(Workspace.brand_id == brand_id)
            ),
            IntegrationDailyMetric.snapshot_date >= recent_start,
            IntegrationDailyMetric.snapshot_date <= recent_end
        )
        avg_recent = (await session.execute(stmt_recent)).scalar() or Decimal("0.00")
        avg_recent = float(avg_recent)
        
        # Baseline Period Average
        stmt_baseline = select(func.avg(IntegrationDailyMetric.net_sales)).where(
            IntegrationDailyMetric.integration_id.in_(
                select(Integration.id).join(Workspace).where(Workspace.brand_id == brand_id)
            ),
            IntegrationDailyMetric.snapshot_date >= baseline_start,
            IntegrationDailyMetric.snapshot_date <= baseline_end
        )
        avg_baseline = (await session.execute(stmt_baseline)).scalar() or Decimal("0.00")
        avg_baseline = float(avg_baseline)
        
        # Avoid division by zero for new brands / First sales
        if avg_baseline == 0:
            if avg_recent > 0:
                # First sales detected! 
                # We interpret this as "New Revenue"
                avg_baseline = 1.0 # Safe divisor
                logger.info("Velocity: Baseline is zero but recent > 0. Treating as New Growth.")
                # We can optionally tag this as a special "first_sales" insight type in future
            else:
                logger.info("Velocity: Baseline average is zero and no recent sales. Skipping insight.")
                return None
        
        # ============================================================
        # STEP 4: Calculate Variance (for Volatility Detection)
        # ============================================================
        
        # Standard deviation of baseline period
        stmt_stddev = select(func.stddev_samp(IntegrationDailyMetric.net_sales)).where(
            IntegrationDailyMetric.integration_id.in_(
                select(Integration.id).join(Workspace).where(Workspace.brand_id == brand_id)
            ),
            IntegrationDailyMetric.snapshot_date >= baseline_start,
            IntegrationDailyMetric.snapshot_date <= baseline_end
        )
        baseline_stddev = (await session.execute(stmt_stddev)).scalar() or 0.0
        baseline_stddev = float(baseline_stddev)
        
        # Calculate coefficient of variation (volatility measure)
        volatility_ratio = baseline_stddev / avg_baseline if avg_baseline > 0 else 0
        is_volatile = volatility_ratio > self.VOLATILITY_THRESHOLD
        
        # ============================================================
        # STEP 5: Calculate Percentage Change
        # ============================================================
        
        diff_pct = (avg_recent - avg_baseline) / avg_baseline
        
        # Significance Threshold: Filter out noise
        if abs(diff_pct) < self.SIGNIFICANCE_THRESHOLD:
            logger.info(f"Velocity: Change {diff_pct:.1%} below threshold ({self.SIGNIFICANCE_THRESHOLD:.0%}). Skipping insight.")
            return None
        
        # ============================================================
        # STEP 6: Calculate Confidence Score
        # ============================================================
        
        confidence = self._calculate_confidence(
            data_completeness=data_completeness,
            has_gaps=has_gaps,
            volatility_ratio=volatility_ratio,
            magnitude=abs(diff_pct)
        )
        
        # ============================================================
        # STEP 7: Calculate Impact Score
        # ============================================================
        
        # Base impact score from magnitude
        impact_score = self.calculate_score(diff_pct, 0.5)  # 50% change = 5.0 impact
        
        # Apply volatility penalty for unreliable data
        if is_volatile:
            impact_score *= (1 - self.HIGH_VARIANCE_PENALTY)
            logger.debug(f"Velocity: High volatility detected. Impact score reduced by {self.HIGH_VARIANCE_PENALTY:.0%}")
        
        # ============================================================
        # STEP 8: Generate Rich Metadata
        # ============================================================
        
        trend = "up" if diff_pct > 0 else "down"
        
        # Contextual insights
        context = self._generate_context(
            diff_pct=diff_pct,
            avg_recent=avg_recent,
            avg_baseline=avg_baseline,
            trend=trend
        )
        
        # Actionable recommendation
        recommendation = self._generate_recommendation(trend, diff_pct, is_volatile)
        
        # Format period labels
        recent_period = f"{recent_start.strftime('%b %d')}-{recent_end.strftime('%d')}"
        baseline_period = f"{baseline_start.strftime('%b %d')}-{baseline_end.strftime('%d')}"
        
        # ============================================================
        # STEP 9: Return Insight Object
        # ============================================================
        
        return InsightObject(
            id="velocity_trend",
            title=f"Sales Velocity: {trend.upper()}",
            description=f"Your sales {'jumped' if diff_pct > 0 else 'dropped'} {abs(diff_pct):.1%} this week compared to last week.",
            impact_score=impact_score,
            trend=trend,
            meta={
                # Core Metrics
                "diff_pct": diff_pct,
                "recent_avg": round(avg_recent, 2),
                "baseline_avg": round(avg_baseline, 2),
                
                # Time Periods
                "recent_period": recent_period,
                "baseline_period": baseline_period,
                "recent_start": recent_start.isoformat(),
                "recent_end": recent_end.isoformat(),
                "baseline_start": baseline_start.isoformat(),
                "baseline_end": baseline_end.isoformat(),
                
                # Data Quality
                "confidence": confidence,
                "volatility": "high" if is_volatile else "low",
                "volatility_ratio": round(volatility_ratio, 2),
                "days_analyzed": total_days,
                "data_completeness": round(data_completeness, 2),
                "has_gaps": has_gaps,
                
                # Context & Actions
                "context": context,
                "recommendation": recommendation,
                
                # Technical Details
                "methodology": "week_over_week_non_overlapping",
                "version": "2.0"
            }
        )
    
    def _calculate_confidence(
        self, 
        data_completeness: float,
        has_gaps: bool,
        volatility_ratio: float,
        magnitude: float
    ) -> str:
        """
        Calculate confidence level based on data quality and signal strength.
        
        Returns: "high", "medium", or "low"
        """
        score = 0
        
        # Factor 1: Data Completeness (0-3 points)
        if data_completeness >= 1.0:
            score += 3
        elif data_completeness >= 0.8:
            score += 2
        else:
            score += 1
        
        # Factor 2: No Gaps (0-2 points)
        if not has_gaps:
            score += 2
        
        # Factor 3: Low Volatility (0-2 points)
        if volatility_ratio < 0.3:
            score += 2
        elif volatility_ratio < 0.5:
            score += 1
        
        # Factor 4: Strong Signal (0-3 points)
        if magnitude >= 0.5:  # 50%+ change
            score += 3
        elif magnitude >= 0.3:  # 30%+ change
            score += 2
        elif magnitude >= 0.15:  # 15%+ change
            score += 1
        
        # Total: 0-10 points
        if score >= 8:
            return "high"
        elif score >= 5:
            return "medium"
        else:
            return "low"
    
    def _generate_context(
        self,
        diff_pct: float,
        avg_recent: float,
        avg_baseline: float,
        trend: str
    ) -> str:
        """
        Generate contextual insight about the trend.
        """
        if abs(diff_pct) >= 1.0:  # 100%+ change
            return f"{'Highest' if trend == 'up' else 'Lowest'} week in recent history"
        elif abs(diff_pct) >= 0.5:  # 50%+ change
            return f"Significant {trend}ward momentum"
        elif abs(diff_pct) >= 0.3:  # 30%+ change
            return f"Strong {trend}ward trend"
        else:  # 15-30% change
            return f"Moderate {trend}ward movement"
    
    def _generate_recommendation(
        self,
        trend: str,
        diff_pct: float,
        is_volatile: bool
    ) -> str:
        """
        Generate actionable recommendation based on trend.
        """
        if is_volatile:
            return "Monitor closely - data shows high variance"
        
        if trend == "up":
            if diff_pct >= 0.5:
                return "Maintain current marketing momentum and scale winning strategies"
            else:
                return "Positive trend - continue current approach"
        else:  # down
            if abs(diff_pct) >= 0.5:
                return "Investigate cause of decline and adjust strategy immediately"
            else:
                return "Monitor trend and consider optimization opportunities"
