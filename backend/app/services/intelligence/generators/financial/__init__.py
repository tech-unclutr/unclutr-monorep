"""
Financial Intelligence Generators
"""

from .ad_waste_generator import AdWasteGenerator
from .frozen_cash_generator import FrozenCashGenerator
from .margin_crusher_generator import MarginCrusherGenerator
from .slow_mover_generator import SlowMoverGenerator
from .stockout_risk_generator import StockoutRiskGenerator

__all__ = [
    "FrozenCashGenerator",
    "StockoutRiskGenerator",
    "MarginCrusherGenerator",
    "SlowMoverGenerator",
    "AdWasteGenerator",
]
