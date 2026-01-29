"""
Fallback Library: Mad Libs-style templates for 100% safe descriptions.

Purpose:
- Provide safe, template-based descriptions when validation fails
- Ensure no hallucinated numbers reach users
- Support multiple currencies and formatting styles
"""

from typing import Dict, Any


class FallbackLibrary:
    """
    Template library for safe insight descriptions.
    Uses Python string formatting with type-safe helpers.
    """
    
    # Template definitions
    TEMPLATES = {
        # Financial Intelligence
        "frozen_cash": "You have {frozen_value} locked in {frozen_items} with no sales in {avg_days_frozen} days.",
        "stockout_risk": "{at_risk_skus} have less than {days_remaining} days of inventory remaining.",
        "margin_crusher": "{negative_margin_items} are selling below cost, losing {total_loss_amount} per sale.",
        "slow_mover": "{slow_items} are moving {velocity_ratio} slower than category average.",
        "ad_waste": "Ad spend of {wasted_spend} on low-converting products (ROI < 1%).",
        
        # Growth Intelligence
        "vip_at_risk": "{at_risk_vips} high-value customers haven't purchased in {avg_days_overdue} days (potential {potential_lost_ltv} loss).",
        "velocity_breakout": "{breakout_products} jumped {velocity_multiplier} in sales this week.",
        "relative_whale": "{whale_count} customers contribute {whale_contribution_pct} of total revenue.",
        "cross_sell": "Top bundle: {bundle_name} with {lift_score} lift score.",
        "geo_spike": "{spike_region} shows {concentration_pct} sales concentration.",
        
        # Operational Intelligence
        "leaking_bucket": "{high_return_skus} have return rates {return_rate_pct} above average.",
        "refund_anomaly": "Refund requests spiked {refund_spike_pct} this week ({total_refund_value}).",
        "fulfillment_bottleneck": "Average fulfillment time is {avg_fulfillment_days} days ({delayed_orders} delayed).",
        "discount_abuse": "{abuse_cases} suspicious discount usage patterns detected.",
        "integration_health": "{failing_integrations} have sync failures (data {data_staleness_hours} hours stale).",
        
        # Inventory (v2.0)
        "inventory_value": "You have {inventory_value} locked in {total_units} units across {total_items} items.",
    }
    
    @staticmethod
    def format_currency(value: float, currency: str = "USD") -> str:
        """
        Format currency with appropriate symbol.
        
        Examples:
        - 12500, "USD" → "$12,500"
        - 12500, "INR" → "₹12,500"
        """
        symbols = {
            "USD": "$",
            "INR": "₹",
            "EUR": "€",
            "GBP": "£"
        }
        symbol = symbols.get(currency, "$")
        
        # Format with commas
        if value >= 1000:
            return f"{symbol}{value:,.0f}"
        else:
            return f"{symbol}{value:.2f}"
    
    @staticmethod
    def format_count(value: int, singular: str = "item", plural: str = None) -> str:
        """
        Format count with proper pluralization.
        
        Examples:
        - 1, "item" → "1 item"
        - 5, "item" → "5 items"
        - 1, "category", "categories" → "1 category"
        """
        if plural is None:
            plural = f"{singular}s"
        
        word = singular if value == 1 else plural
        return f"{value} {word}"
    
    @staticmethod
    def format_percentage(value: float) -> str:
        """
        Format percentage.
        
        Examples:
        - 0.45 → "45%"
        - 1.2 → "120%"
        """
        return f"{value * 100:.0f}%"
    
    @staticmethod
    def format_multiplier(value: float) -> str:
        """
        Format multiplier.
        
        Examples:
        - 3.2 → "3.2x"
        - 10 → "10x"
        """
        if value >= 10:
            return f"{value:.0f}x"
        else:
            return f"{value:.1f}x"
    
    @staticmethod
    def format_days(value: int) -> str:
        """
        Format days with proper unit.
        
        Examples:
        - 1 → "1 day"
        - 60 → "60 days"
        """
        return f"{value} day" if value == 1 else f"{value} days"
    
    def apply_template(
        self, 
        insight_id: str, 
        meta: Dict[str, Any],
        currency: str = "USD"
    ) -> str:
        """
        Apply template with formatted values.
        
        Args:
            insight_id: ID of the insight (e.g., "frozen_cash")
            meta: Metadata dictionary with values
            currency: Currency code for formatting
        
        Returns:
            Formatted description string
        """
        template = self.TEMPLATES.get(insight_id)
        if not template:
            return f"Insight data: {insight_id}"
        
        # Build formatted values
        formatted = {}
        
        for key, value in meta.items():
            if value is None:
                formatted[key] = "N/A"
                continue
            
            # Detect type and format accordingly
            if "value" in key or "amount" in key or "revenue" in key or "ltv" in key or "spend" in key:
                # Currency
                formatted[key] = self.format_currency(float(value), currency)
            elif "pct" in key or "percent" in key or "ratio" in key:
                # Percentage
                if isinstance(value, str) and '%' in value:
                    formatted[key] = value
                else:
                    formatted[key] = self.format_percentage(float(value))
            elif "multiplier" in key:
                # Multiplier
                formatted[key] = self.format_multiplier(float(value))
            elif "days" in key:
                # Days
                formatted[key] = self.format_days(int(value))
            elif "count" in key or "items" in key or "skus" in key or "products" in key or "customers" in key or "vips" in key or "cases" in key:
                # Count
                singular = key.replace("_count", "").replace("_", " ")
                formatted[key] = self.format_count(int(value), singular)
            else:
                # Default: use as-is
                formatted[key] = str(value)
        
        try:
            return template.format(**formatted)
        except KeyError as e:
            # Missing key in meta
            return f"Template error: missing {e}"


# Singleton instance
fallback_library = FallbackLibrary()
