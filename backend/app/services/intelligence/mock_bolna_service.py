from uuid import UUID

from app.models.interview import InterviewSession


class MockBolnaService:
    """
    Simulates a Bolna Voice Agent interview.
    Generates a high-quality, structured transcript following the "Decision-Capture" script.
    """

    SCRIPT_STEPS = [
        "Context", "Decision", "Success Metric", "Hypothesis", "Evidence", 
        "Top Questions", "Tradeoff", "Cohorts", "Constraints", "Confirmation"
    ]

    def generate_mock_transcript(self, stakeholder_name: str = "Alice", role: str = "CMO") -> str:
        """
        Returns a pre-canned transcript that mimics a perfect stakeholder interview.
        This provides the 'ideal input' to test our extraction logic.
        """
        return f"""
        [Agent]: Hi {stakeholder_name}, I'm the Unclutr Intake Agent. I'm here to convert your request into a strict research plan. Let's start. What change, launch, or problem are we dealing with right now?
        
        [{stakeholder_name}]: We're seeing a 15% drop in checkout conversion on mobile since the last UI update. We suspect it's the new 'Guest Checkout' flow.
        
        [Agent]: Got it. Mobile checkout drop. What specific decision do you need to make in the next 2-4 weeks?
        
        [{stakeholder_name}]: We need to decide whether to roll back the Guest Checkout changes completely or just tweak the button placement.
        
        [Agent]: Clear. Roll back or tweak. If we get this right, what metric moves? By how much? By when?
        
        [{stakeholder_name}]: Mobile checkout conversion rate (CVR) should return to 2.5% within 30 days of the fix.
        
        [Agent]: Understood. Target is mobile CVR back to 2.5%. What do you currently believe is true—and why?
        
        [{stakeholder_name}]: I believe the 'Guest Checkout' button is too hidden below the fold. Users think they MUST login, so they leave.
        
        [Agent]: Hypothesis: Button visibility is the blocker. What customer evidence would make you reverse that belief?
        
        [{stakeholder_name}]: If users tell us they see the button but don't trust the security badges, or if they say they prefer creating an account but the form is broken.
        
        [Agent]: Okay. Trust vs. Usability. What are the 3-5 questions we must answer from customers?
        
        [{stakeholder_name}]: 1. Did you see the Guest Checkout option? 2. Why did you choose to login instead? 3. Was there any friction in the payment field?
        
        [Agent]: Great questions. If we can only learn ONE thing from 20 calls, what should it be?
        
        [{stakeholder_name}]: Whether they actually missed the button or if they ignored it on purpose. That determines if it's a UI fix or a trust fix.
        
        [Agent]: Focused on "Missed vs. Ignored". Which customers should we speak to to answer this fastest?
        
        [{stakeholder_name}]: Mobile users who abandoned cart at the login step in the last 72 hours. High intent only (cart value > $50).
        
        [Agent]: Mobile abandoners > $50. Any do-not-ask topics or compliance constraints?
        
        [{stakeholder_name}]: Don't ask about specific credit card errors, we can't record that PII. And keep the call under 5 minutes.
        
        [Agent]: Noted. No PII, short calls. Let me confirm: Your top decision is whether to rollback Guest Checkout, success metric is Mobile CVR > 2.5%, we believe it's a visibility issue, and we need to ask "Did you see it?". Correct?
        
        [{stakeholder_name}]: Yes, spot on.
        """

    async def create_session(self, session, company_id: UUID, user_id: str) -> InterviewSession:
        """Creates a new interview session in IN_PROGRESS state."""
        db_session = InterviewSession(
            company_id=company_id,
            user_id=user_id,
            status="IN_PROGRESS",
            metadata_info={"provider": "mock_bolna", "version": "1.0"}
        )
        session.add(db_session)
        await session.commit()
        await session.refresh(db_session)
        return db_session

mock_bolna_service = MockBolnaService()
