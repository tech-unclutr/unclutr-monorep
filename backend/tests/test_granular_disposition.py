
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime, timedelta
from app.api.v1.endpoints.bolna_webhook import bolna_webhook
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign import Campaign

# Mock Dependencies
@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.execute = AsyncMock()
    session.get = AsyncMock()
    return session

@pytest.fixture
def mock_q_item():
    return QueueItem(
        id=1,
        campaign_id="123e4567-e89b-12d3-a456-426614174000",
        lead_id=100,
        status="DIALING_INTENT"
    )

@pytest.fixture
def mock_exec_map():
    return BolnaExecutionMap(
        id=1,
        bolna_call_id="call-123",
        queue_item_id=1,
        campaign_id="123e4567-e89b-12d3-a456-426614174000",
        bolna_agent_id="agent-xyz"
    )

@pytest.mark.asyncio
async def test_disposition_waterfall(mock_session, mock_q_item, mock_exec_map):
    """
    Test the 19-state waterfall logic.
    """
    
    # Setup Mocks
    mock_session.get.side_effect = lambda model, id: mock_q_item if model == QueueItem else None
    
    # Mock Select Execution Map
    mock_result = MagicMock()
    mock_result.scalars().first.return_value = mock_exec_map
    mock_session.execute.return_value = mock_result
    
    # Helper to run webhook
    async def run_webhook(payload):
        # Reset Mocks logic
        mock_q_item.status = "DIALING_INTENT"
        mock_q_item.outcome = None
        mock_exec_map.transcript = None
        mock_exec_map.extracted_data = {}
        
        # Configure execute side effects For THIS run
        # 1. BolnaExecutionMap query
        res_map = MagicMock()
        res_map.scalars().first.return_value = mock_exec_map
        
        # 2. CallLog query
        res_log = MagicMock()
        res_log.scalars().first.return_value = None # Simulate no existing log
        
        # We might have other queries? 
        # But primarily these two.
        mock_session.execute.side_effect = [res_map, res_log, res_map, res_log, res_map, res_log] # Allow buffer
        
        await bolna_webhook(payload, session=mock_session)
        return mock_q_item.status, mock_q_item.outcome

    # 1. SCHEDULED (Explicit)
    # -----------------------
    payload_scheduled = {
        "execution_id": "call-123",
        "extracted_data": {"callback_time": (datetime.utcnow() + timedelta(hours=2)).isoformat()},
        "transcript": "Call me later."
    }
    # Mock Scheduler Check
    with patch("app.api.v1.endpoints.bolna_webhook.scheduling_service.is_slot_in_windows", return_value=True):
        status, outcome = await run_webhook(payload_scheduled)
        assert status == "SCHEDULED"
        assert outcome == "Scheduled"

    # 2. DNC (Hard Block)
    # -------------------
    payload_dnc = {
        "execution_id": "call-123",
        "transcript": "Stop calling me, remove my number immediately.",
        "extracted_data": {"not_interested": True}
    }
    status, outcome = await run_webhook(payload_dnc)
    assert outcome == "DNC / Stop"

    # 3. WRONG PERSON (Non-Retriable)
    # ---------------
    payload_wrong = {
        "execution_id": "call-123",
        "transcript": "I think you have the wrong person, no one by that name lives here.",
        "extracted_data": {"not_interested": True, "wrong_person": True}
    }
    status, outcome = await run_webhook(payload_wrong)
    assert status == "WRONG_PERSON"
    assert outcome == "Wrong Person"    # 4. LANGUAGE BARRIER (Retriable)
    # -------------------
    payload_lang = {
        "execution_id": "call-123",
        "transcript": "No english, speak Hindi?",
        "extracted_data": {"language_barrier": True}
    }
    status, outcome = await run_webhook(payload_lang)
    assert status == "READY"
    assert "Retry Pending: Language Barrier" in outcome
    
    # 5. VOICEMAIL (Retriable)
    # -------------------------------
    payload_vm = {
        "execution_id": "call-123",
        "answered_by_voice_mail": True,
        "transcript": "Please leave a message after the beep.",
        "extracted_data": {"not_interested": True} 
    }
    status, outcome = await run_webhook(payload_vm)
    assert status == "READY"
    assert "Retry Pending: Voicemail" in outcome

    # 6. INTENT YES (Non-Retriable)
    # -------------
    payload_yes = {
        "execution_id": "call-123",
        "extracted_data": {"interested": True},
        "transcript": "Yes I am interested."
    }
    status, outcome = await run_webhook(payload_yes)
    assert status == "INTENT_YES"
    assert outcome == "Interested"

    # 7. INTENT NO (Non-Retriable)
    # ------------
    payload_no = {
        "execution_id": "call-123",
        "extracted_data": {"not_interested": True},
        "transcript": "No thanks, I'm good."
    }
    status, outcome = await run_webhook(payload_no)
    assert status == "INTENT_NO"
    assert outcome == "Not Interested"

    # 8. BUSY (Retriable)
    # -------
    payload_busy = {
        "execution_id": "call-123",
        "status": "busy",
        "hangup_reason": "user_busy"
    }
    status, outcome = await run_webhook(payload_busy)
    assert status == "READY"
    assert "Retry Pending: Busy" in outcome

    # 9. FAX/ROBOT (Retriable)
    # ------------
    payload_machine = {
        "execution_id": "call-123",
        "call_outcome": "machine",
        "termination_reason": "fax_detected",
        "status": "completed"
    }
    status, outcome = await run_webhook(payload_machine)
    assert status == "READY"
    assert "Retry Pending: Fax/Robot" in outcome

    # 10. FAILED CONNECT (Retriable)
    # -----------------------------------
    payload_invalid = {
        "execution_id": "call-123",
        "status": "failed",
        "transcript": "The number you have dialed is not in service."
    }
    status, outcome = await run_webhook(payload_invalid)
    assert status == "READY"
    assert "Retry Pending: Connection Failed" in outcome

    # 11. NO ANSWER (Retriable)
    # -------------
    payload_no_ans = {
        "execution_id": "call-123",
        "status": "no-answer"
    }
    status, outcome = await run_webhook(payload_no_ans)
    assert status == "READY"
    assert "Retry Pending: No Answer" in outcome

    # 12. SILENCE (Retriable)
    # ------------------------
    mock_exec_map.call_status = "completed"
    mock_exec_map.call_duration = 10
    payload_silence = {
        "execution_id": "call-123",
        "status": "completed",
        "duration": 10,
        "transcript": "   " 
    }
    status, outcome = await run_webhook(payload_silence)
    assert status == "READY"
    assert "Retry Pending: Silence (Ghost)" in outcome

    # 13. IMMEDIATE HANGUP (Retriable)
    # --------------------
    mock_exec_map.call_duration = 2
    payload_hangup = {
        "execution_id": "call-123",
        "status": "completed",
        "duration": 2,
        "hangup_by": "Callee",
        "transcript": "Hello?"
    }
    status, outcome = await run_webhook(payload_hangup)
    assert status == "READY"
    assert "Retry Pending: Immediate Hangup" in outcome

    # 14. AMBIGUOUS (Retriable)
    # ---------------------------
    mock_exec_map.call_duration = 30
    payload_ambig = {
        "execution_id": "call-123",
        "status": "completed",
        "duration": 30,
        "transcript": "Yes, hello. Who is this? Okay bye."
    }
    status, outcome = await run_webhook(payload_ambig)
    assert status == "READY"
    assert "Retry Pending: Ambiguous" in outcome

