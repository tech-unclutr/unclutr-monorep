from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class PlaybookStep(BaseModel):
    id: str
    text: str
    type: str = "instruction" # instruction, link, check
    link: Optional[str] = None
    action_label: Optional[str] = None

class Playbook(BaseModel):
    insight_type: str
    title: str
    steps: List[PlaybookStep]
    simulation_params: Optional[Dict[str, Any]] = None

class PlaybookService:
    """
    Returns structured resolution guides for insights.
    Ideally these would be stored in DB or CMS, but hardcoded dictionary is fine for V1.
    """
    
    _LIBRARY = {
        "slow_movers": {
            "title": "Clear Dead Stock",
            "steps": [
                PlaybookStep(id="1", text="Review the product details in Shopify.", type="link", link="https://admin.shopify.com/store/{store_domain}/products/{product_id}", action_label="Open In Shopify"),
                PlaybookStep(id="2", text="Apply a 'Clearance' tag to the product.", type="instruction"),
                PlaybookStep(id="3", text="Create a discount code 'CLEAR50' for 50% off.", type="instruction"),
                PlaybookStep(id="4", text="Send an email campaign to your 'Engaged' segment.", type="instruction")
            ],
            "simulation_params": {
                "type": "inventory_clearance",
                "inputs": ["discount_percent", "marketing_spend"],
                "ui_config": {
                    "label": "Discount Rate",
                    "unit": "%",
                    "min": 0,
                    "max": 100,
                    "default": 30,
                    "impact_label": "Recovered Cash",
                    "impact_factor": 150
                }
            },
            "verification_intent": {
                "type": "add_tag",
                "tag": "Clearance"
            }
        },
        "ad_waste_proxy_returns": {
            "title": "Fix High Return Rate",
            "steps": [
                PlaybookStep(id="1", text="Analyze return comments in Shopify.", type="link", link="https://admin.shopify.com/store/{store_domain}/orders", action_label="View Orders"),
                PlaybookStep(id="2", text="Check if ad creative matches the landing page product description.", type="instruction"),
                PlaybookStep(id="3", text="Update product description to be more accurate (sizing, material).", type="instruction"),
                PlaybookStep(id="4", text="Pause ads targeting 'Broad' audiences for this SKU.", type="instruction")
            ],
            "simulation_params": {
                "type": "return_reduction",
                "inputs": ["conversion_drop_buffer"]
            }
        },
        "geo_spike": {
            "title": "Capitalize on Regional Spike",
            "steps": [
                PlaybookStep(id="1", text="Create a new Meta Ad Campaign targeting this specific region.", type="instruction"),
                PlaybookStep(id="2", text="Mention the city/region name in the ad copy.", type="instruction"),
                PlaybookStep(id="3", text="Duplicate the best performing creative.", type="instruction")
            ],
            "simulation_params": None
        }
    }

    def get_playbook(self, insight_type: str, context: Dict[str, Any]) -> Optional[Playbook]:
        template = self._LIBRARY.get(insight_type)
        if not template:
            # Fallback generic playbook
            return Playbook(
                insight_type="generic",
                title="Investigate Issue",
                steps=[
                    PlaybookStep(id="1", text="Open Shopify Dashboard.", type="link", link="https://admin.shopify.com", action_label="Go to Shopify"),
                    PlaybookStep(id="2", text="Review the metrics manually.", type="instruction")
                ]
            )
            
        # Hydrate links if needed (e.g. replace product_id)
        # Note: This requires store_domain from context.
        store_domain = context.get("store_domain", "unclutr-demo")
        product_id = context.get("product_id", "")
        
        hydrated_steps = []
        for step in template["steps"]:
            new_step = step.copy() # Shallow copy
            if new_step.link:
                new_step.link = new_step.link.format(store_domain=store_domain, product_id=product_id)
            hydrated_steps.append(new_step)
            
        return Playbook(
            insight_type=insight_type,
            title=template["title"],
            steps=hydrated_steps,
            simulation_params=template.get("simulation_params")
        )

playbook_service = PlaybookService()
