from abc import ABC, abstractmethod
from datetime import date
from typing import Dict

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.integration import Integration
from app.models.integration_analytics import IntegrationDailyMetric


class BaseAnalyticsProvider(ABC):
    @abstractmethod
    async def calculate_daily_metrics(
        self, 
        session: AsyncSession, 
        integration: Integration, 
        target_date: date
    ) -> IntegrationDailyMetric:
        pass

class AnalyticsFactory:
    _providers: Dict[str, BaseAnalyticsProvider] = {}

    @classmethod
    def register(cls, slug: str, provider: BaseAnalyticsProvider):
        cls._providers[slug] = provider

    @classmethod
    def get_provider(cls, slug: str) -> BaseAnalyticsProvider:
        provider = cls._providers.get(slug)
        if not provider:
            raise ValueError(f"No analytics provider registered for {slug}")
        return provider
