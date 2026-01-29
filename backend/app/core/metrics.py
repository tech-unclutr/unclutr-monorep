"""
Prometheus metrics for Intelligence Engine.
Tracks performance, coverage, and error rates.
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from functools import wraps
import time
from typing import Callable
from loguru import logger

# Metrics
insight_generation_duration = Histogram(
    'insight_generation_duration_seconds',
    'Time spent generating insights',
    ['brand_id', 'generator']
)

insight_generation_total = Counter(
    'insight_generation_total',
    'Total number of insight generation attempts',
    ['brand_id', 'status']  # status: success, error, disabled
)

insight_coverage_rate = Gauge(
    'insight_coverage_rate',
    'Percentage of brands with at least one insight',
)

generator_errors = Counter(
    'generator_errors_total',
    'Total number of generator errors',
    ['generator', 'error_type']
)

insight_impact_score = Histogram(
    'insight_impact_score',
    'Distribution of insight impact scores',
    ['insight_id']
)

cache_hits = Counter(
    'insight_cache_hits_total',
    'Number of cache hits for insight generation'
)

cache_misses = Counter(
    'insight_cache_misses_total',
    'Number of cache misses for insight generation'
)

def track_generation_time(generator_name: str):
    """Decorator to track insight generation time."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Extract brand_id from args if available
                brand_id = str(kwargs.get('brand_id', 'unknown'))
                
                insight_generation_duration.labels(
                    brand_id=brand_id,
                    generator=generator_name
                ).observe(duration)
                
                return result
            except Exception as e:
                logger.error(f"Error in {generator_name}: {e}")
                raise
        return wrapper
    return decorator

def get_metrics():
    """Return Prometheus metrics in text format."""
    return generate_latest()
