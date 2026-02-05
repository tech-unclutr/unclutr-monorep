import logging

import vertexai
from vertexai.generative_models import GenerativeModel

from app.core.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        vertexai.init(project=settings.GOOGLE_CLOUD_PROJECT, location=settings.GOOGLE_CLOUD_LOCATION)
        self.model = GenerativeModel("gemini-2.0-flash")

    async def get_insight(self, prompt: str) -> str:
        """
        Base method to get insights from Gemini 1.5 Pro.
        """
        try:
            # Note: This is a synchronous call in the SDK, in a real app 
            # we'd use a threadpool or the async version if available.
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API Error: {e}", exc_info=True)
            return f"Error: {str(e)}"

ai_service = AIService()
