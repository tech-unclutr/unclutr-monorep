
import os
import asyncio
import json
import time
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from loguru import logger
from app.core.config import settings

# In-memory cache for simplicity and speed
# Structure: {cache_key: {"data": response, "expires_at": timestamp}}
insight_cache = {}

class LLMService:
    """
    LLM Service using Google Gemini (Flash/Pro).
    
    Capabilities:
    1. Context Enrichment (WHY is this happening?)
    2. Recommendations (WHAT to do?)
    3. Morning Briefing (Personalized Summary)
    4. Self-Healing (Retry on hallucination)
    
    Constraints:
    - NEVER calculates numbers.
    - Uses caching to minimize latency and cost.
    """
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found. LLM features will be disabled.")
            self.model = None
        else:
            genai.configure(api_key=self.api_key)
            # Use 'gemini-2.0-flash' as it is the currently available model
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            self.pro_model = genai.GenerativeModel('gemini-2.0-flash')

    async def enrich_context(self, insight: Any) -> str:
        """
        Generate "WHY" context for an insight. Uses 24h cache.
        """
        if not self.model:
            return ""

        cache_key = f"context_{insight.id}_{hash(json.dumps(insight.meta, sort_keys=True))}"
        if cached := self._get_from_cache(cache_key):
            return cached

        prompt = f"""
        You are a retail operations expert. 
        Insight: {insight.title}
        Description: {insight.description}
        Metadata: {json.dumps(insight.meta, indent=2)}
        
        Task: Explain in 1-2 sentences WHY this situation is happening.
        Constraints:
        - Be professional but conversational.
        - Do NOT repeat numbers from the description.
        - Focus on potential root causes (seasonality, market trends, operational bottlenecks).
        """
        
        try:
            response = await self._generate(prompt)
            self._set_cache(cache_key, response)
            return response
        except Exception as e:
            logger.error(f"LLM Enrichment failed: {e}")
            return ""

    async def generate_recommendations(self, insight: Any) -> List[str]:
        """
        Generate 3 actionable recommendations. Uses 24h cache.
        """
        if not self.model:
            return []

        cache_key = f"recs_{insight.id}_{hash(json.dumps(insight.meta, sort_keys=True))}"
        if cached := self._get_from_cache(cache_key):
            return cached

        prompt = f"""
        You are a retail strategist.
        Insight: {insight.title}
        Description: {insight.description}
        Metadata: {json.dumps(insight.meta, indent=2)}
        
        Task: Suggest 3 specific, actionable steps to address this.
        Format: Return ONLY a JSON array of strings. Example: ["Run a flash sale", "Contact supplier"]
        """
        
        try:
            text = await self._generate(prompt)
            # Clean up potential markdown code blocks
            text = text.replace("```json", "").replace("```", "").strip()
            recs = json.loads(text)
            self._set_cache(cache_key, recs)
            return recs
        except Exception as e:
            logger.error(f"LLM Recs failed: {e}")
            return ["Review inventory levels", "Monitor sales trend", "Check supplier lead times"]

    async def chat_about_insight(self, context: Dict[str, Any], message: str) -> str:
        """
        Generates a response to a user's question about a specific insight.
        """
        if not self.model:
            return "AI services are unavailable. Please check your API key."

        try:
            prompt = f"""
            You are an expert E-commerce Strategic Advisor.
            
            CONTEXT:
            Insight Title: {context.get('title')}
            Description: {context.get('description')}
            Data: {context.get('meta')}
            
            USER QUESTION:
            "{message}"
            
            Provide a concise, helpful answer (max 3 sentences). 
            Focus on business impact and actionable advice.
            Do not hallucinate data not present in the CONTEXT.
            """
            
            response = await self._generate(prompt)
            return response
            
        except Exception as e:
            logger.error(f"Chat generation failed: {e}")
            return "I'm having trouble analyzing this right now. Please try again."

    async def generate_morning_briefing(self, user_name: str, insights: List[Any]) -> str:
        """
        Generate a personalized morning briefing.
        """
        if not self.model:
            return f"Good morning, {user_name}. You have {len(insights)} priority insights to review."

        # Cache key based on insight IDs to avoid regenerating for same state
        insight_ids = sorted([i.id for i in insights])
        cache_key = f"briefing_{user_name}_{hash(tuple(insight_ids))}"
        # Shorter cache for briefing (e.g., 1 hour)
        if cached := self._get_from_cache(cache_key):
             return cached

        insight_summaries = [
            f"- [{i.meta.get('category', 'operational').upper()}] {i.title}: {i.description} (Impact: {i.impact_score}/10)"
            for i in insights
        ]

        prompt = f"""
        You are an executive assistant for {user_name}, a retail business owner.
        
        Top Insights for today:
        {chr(10).join(insight_summaries)}
        
        Task:
        1. Rate the store's overall health on a scale of 0-100 based on these insights (100 = Perfect, <50 = Critical).
        2. Write a 2-3 sentence Morning Briefing greeting {user_name}.
        3. START with the score in brackets, e.g. "[Health: 85/100] Good morning..."
        
        Tone: 
        - If Health < 70: Urgent, direct, focused on the fire.
        - If Health > 90: Celebratory, encouraging.
        - Otherwise: Professional, balanced.
        
        Do NOT list all insights. Synthesize the "State of the Union".
        """

        try:
            # Use Pro model for better synthesis
            response = await self._generate(prompt, model_type="flash")
            self._set_cache(cache_key, response, ttl=3600)
            return response
        except Exception as e:
            logger.error(f"LLM Briefing failed: {e}")
            return f"Good morning, {user_name}. Here is your daily intelligence deck."

    async def validate_and_fix(self, text: str, source_metrics: Dict[str, Any], error_msg: str, attempt: int = 1) -> str:
        """
        Self-Healing Mechanism:
        If validation fails, retry generation with correction prompt.
        """
        if not self.model:
            return text 

        if attempt > 2:
            # If still failing after 2 retries, give up (caller handles fallback)
            return text 

        prompt = f"""
        You are a meticulous metrics analyst.
        I asked for a description of a business insight, but your previous answer was factually incorrect based on the data.
        
        Previous Answer: "{text}"
        Validation Error: {error_msg}
        Actual Data: {json.dumps(source_metrics, indent=2)}
        
        Task: Rewrite the description to be 100% accurate to the Actual Data.
        Constraint: Do NOT make up numbers. Use ONLY the numbers provided in Actual Data.
        """
        
        try:
            fixed_text = await self._generate(prompt, model_type="flash")
            return fixed_text
        except Exception as e:
            logger.error(f"LLM Self-Healing failed (Attempt {attempt}): {e}")
            return text

    async def _generate(self, prompt: str, model_type: str = "flash") -> str:
        """
        Internal wrapper for Gemini generation with timeout.
        """
        try:
            model = self.pro_model if model_type == "pro" else self.model
            
            # Set timeout based on model type
            timeout = 90.0 if model_type == "pro" else 60.0
            
            logger.info(f"LLM Generation starting (model: {model_type}, timeout: {timeout}s)")
            start_time = time.time()
            
            response = await asyncio.wait_for(
                model.generate_content_async(prompt),
                timeout=timeout
            )
            
            duration = time.time() - start_time
            logger.info(f"LLM Generation completed in {duration:.2f}s")
            
            return response.text.strip()
        except asyncio.TimeoutError:
            logger.error(f"LLM Generation timed out after {timeout}s ({model_type})")
            # Return a clear error or fallback instead of just raising generic RuntimeError
            raise TimeoutError(f"LLM generation timed out after {timeout}s")
        except Exception as e:
            logger.error(f"LLM Generation failed: {e}")
            raise e

    async def extract_campaign_context(self, transcript: str) -> Dict[str, Any]:
        """
        Extracts structured rigid JSON from an interview transcript.
        """
        if not self.model:
            logger.warning("Mocking LLM extraction due to missing key.")
            return {
                "decision_1": "Mock Decision",
                "success_metric_1": "Mock Metric",
                "quality_score": 0
            } # Fallback/Mock

        prompt = f"""
        You are a Research Analyst.
        
        TRANSCRIPT:
        {transcript}
        
        Task: Extract the following structured data from the transcript.
        Return ONLY valid JSON.
        
        Schema:
        {{
          "stakeholder_name": "Name or Role",
          "role": "Role",
          "problem_context": "Short summary of the problem",
          "decision_1": "The primary decision to make",
          "decision_1_deadline": "YYYY-MM-DD or null",
          "success_metric_1": "Metric + Target + Timeframe",
          "current_hypothesis": "What they believe",
          "evidence_needed": "What would change their mind",
          "top_questions": ["Q1", "Q2", "Q3"],
          "tradeoff_focus": "The ONE thing to learn",
          "target_cohorts": ["Who to call"],
          "constraints": ["Do not ask...", "Time limit..."],
          "definition_of_done": "Evidence required"
        }}
        """

        try:
            # Use Pro model for complex extraction
            text = await self._generate(prompt, model_type="pro")
            text = text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"LLM Extraction failed: {e}")
            return {}

    def _get_from_cache(self, key: str) -> Any:
        if key in insight_cache:
            entry = insight_cache[key]
            if time.time() < entry["expires_at"]:
                return entry["data"]
            else:
                del insight_cache[key]
        return None

    def _set_cache(self, key: str, value: Any, ttl: int = 86400): # Default 24h
        insight_cache[key] = {
            "data": value,
            "expires_at": time.time() + ttl
        }

# Singleton instance
llm_service = LLMService()
