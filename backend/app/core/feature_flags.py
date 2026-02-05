"""
Feature flag configuration for Intelligence Engine.
Allows graceful enabling/disabling of insights without code deployment.
"""
import os

from loguru import logger


class FeatureFlags:
    """Centralized feature flag management."""
    
    @staticmethod
    def is_intelligence_enabled() -> bool:
        """Check if Intelligence Engine is enabled."""
        enabled = os.getenv("FEATURE_INTELLIGENCE_ENGINE", "true").lower() == "true"
        if not enabled:
            logger.info("Intelligence Engine is DISABLED via feature flag")
        return enabled
    
    @staticmethod
    def get_min_velocity_days() -> int:
        """Minimum days of data required for velocity insights."""
        return int(os.getenv("INTELLIGENCE_MIN_VELOCITY_DAYS", "7"))
    
    @staticmethod
    def get_velocity_threshold() -> float:
        """Significance threshold for velocity changes (default 15%)."""
        return float(os.getenv("INTELLIGENCE_VELOCITY_THRESHOLD", "0.15"))
    
    @staticmethod
    def get_cache_ttl_seconds() -> int:
        """Cache TTL for insight generation (default 5 minutes)."""
        return int(os.getenv("INTELLIGENCE_CACHE_TTL", "300"))
    
    @staticmethod
    def is_performance_monitoring_enabled() -> bool:
        """Check if performance monitoring is enabled."""
        return os.getenv("FEATURE_PERFORMANCE_MONITORING", "true").lower() == "true"

# Singleton instance
feature_flags = FeatureFlags()
