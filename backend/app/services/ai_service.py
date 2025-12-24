import vertexai
from vertexai.generative_models import GenerativeModel, Content, Part
from app.core.config import settings

class AIService:
    def __init__(self):
        vertexai.init(project=settings.GOOGLE_CLOUD_PROJECT, location=settings.GOOGLE_CLOUD_LOCATION)
        self.model = GenerativeModel("gemini-1.5-pro")

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
            print(f"Gemini API Error: {e}")
            return f"Error: {str(e)}"

ai_service = AIService()
