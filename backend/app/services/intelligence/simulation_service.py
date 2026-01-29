from typing import Dict, Any, Optional

class SimulationService:
    """
    Stateless math engine for 'What If' scenarios.
    """
    
    def simulate(self, scenario_type: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Routes simulation requests.
        """
        if scenario_type == "inventory_clearance":
            return self._sim_inventory_clearance(inputs)
        elif scenario_type == "return_reduction":
            return self._sim_return_reduction(inputs)
        
        return {"error": "Unknown scenario type"}

    def _sim_inventory_clearance(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate impact of clearing stock at a discount.
        Inputs: current_value, discount_percent (0.0-1.0), holding_cost_monthly
        """
        current_val = float(inputs.get("current_value", 0))
        discount = float(inputs.get("discount_percent", 0.5))
        holding_cost = float(inputs.get("holding_cost_monthly", 50)) # Default $50/mo
        
        # Scenario: Sell all in 1 month vs 12 months
        recovered_cash = current_val * (1.0 - discount)
        savings = holding_cost * 12 # Assume we save a year of holding costs
        
        return {
            "recovered_cash": recovered_cash,
            "cost_savings": savings,
            "total_benefit": recovered_cash + savings,
            "margin_impact": -(current_val * discount) # Loss in potential revenue
        }

    def _sim_return_reduction(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate saved revenue from reducing returns.
        """
        revenue = float(inputs.get("revenue_7d", 0))
        current_rate = float(inputs.get("current_rate", 0))
        target_rate = float(inputs.get("target_rate", current_rate * 0.5))
        
        saved_revenue = revenue * ((current_rate - target_rate) / 100.0)
        
        return {
            "saved_revenue_weekly": saved_revenue,
            "projected_annual_savings": saved_revenue * 52
        }

simulation_service = SimulationService()
