"""
Financial Intelligence Generators
"""

from .frozen_cash_generator import FrozenCashGenerator
from .stockout_risk_generator import StockoutRiskGenerator
from .margin_crusher_generator import MarginCrusherGenerator
from .slow_mover_generator import SlowMoverGenerator
from .ad_waste_generator import AdWasteGenerator

__all__ = [
    "FrozenCashGenerator",
    "StockoutRiskGenerator",
    "MarginCrusherGenerator",
    "SlowMoverGenerator",
    "AdWasteGenerator",
]
