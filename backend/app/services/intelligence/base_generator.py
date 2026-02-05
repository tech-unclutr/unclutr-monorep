from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel


class InsightObject(BaseModel):
    id: str  # Unique slug for the insight type
    title: str
    description: str
    impact_score: float  # 0 to 10 scale
    trend: Optional[str] = None # 'up', 'down', 'neutral'
    meta: Dict[str, Any] = {}

class BaseInsightGenerator(ABC):
    """
    Abstract Interface for Tier 1 Intelligence.
    All generators must implement the 'run' method.
    """
    
    @abstractmethod
    async def run(self, session, brand_id: UUID) -> Optional[InsightObject]:
        """
        Executes the specific insight logic.
        Returns an InsightObject if the signal is significant, else None.
        """
        pass

    def calculate_score(self, value: float, threshold: float, max_impact: float = 10.0) -> float:
        """
        Standardized scoring math: (Value / Threshold) pinned to max_impact.
        Used to rank insights against each other.
        """
        if threshold == 0:
            return 0.0
        score = (abs(value) / threshold) * 5.0 # Baseline weighting
        return min(score, max_impact)
