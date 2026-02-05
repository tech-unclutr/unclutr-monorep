import asyncio
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any
from uuid import uuid4

# Mock classes to simulate the environment
class MockExecMap:
    def __init__(self, transcript, updated_at):
        self.id = uuid4()
        self.last_webhook_payload = {"transcript": transcript}
        self.updated_at = updated_at
        self.call_status = "completed"

class MockLead:
    def __init__(self, name):
        self.id = uuid4()
        self.customer_name = name

def get_campaign_events_mock(exec_maps, leads):
    events = []
    NAMES = ["Alex"]
    
    for exec_map, lead in zip(exec_maps, leads):
        agent_name = NAMES[0]
        transcript_data = exec_map.last_webhook_payload.get('transcript')
        has_transcript_events = False
        
        if isinstance(transcript_data, list):
            for i, turn in enumerate(transcript_data):
                # ... skipping list logic as it was existing
                pass
        elif isinstance(transcript_data, str) and transcript_data.strip():
            turns = re.split(r'(Agent:|User:|Assistant:|\[Agent\]:|\[User\]:|\[Assistant\]:)', transcript_data)
            reconstructed_turns = []
            current_role = None
            for part in turns:
                clean_part = part.strip().strip('[]:')
                low_part = clean_part.lower()
                if low_part in ['agent', 'assistant']:
                    current_role = 'agent'
                elif low_part == 'user':
                    current_role = 'user'
                elif current_role and clean_part:
                    reconstructed_turns.append({'role': current_role, 'content': clean_part})
            
            if reconstructed_turns:
                for i, turn in enumerate(reconstructed_turns):
                    role = turn['role']
                    content = turn['content'].strip()
                    if not content: continue
                    msg = f"{agent_name}: {content}" if role == 'agent' else f"{lead.customer_name}: {content}"
                    
                    turn_ts = (exec_map.updated_at + timedelta(milliseconds=i*100)).isoformat()
                    events.append({
                        "id": f"{exec_map.id}-str-turn-{i}",
                        "timestamp": turn_ts,
                        "type": "agent_action",
                        "agent_name": agent_name,
                        "message": msg,
                    })
                    has_transcript_events = True
    return events

def test_parsing():
    print("Testing string transcript parsing...")
    transcript = "Agent: Hello User: Hi Agent: How are you? User: I am good."
    updated_at = datetime.now()
    exec_map = MockExecMap(transcript, updated_at)
    lead = MockLead("John Doe")
    
    events = get_campaign_events_mock([exec_map], [lead])
    
    for e in events:
        print(f"[{e['timestamp']}] {e['agent_name']}: {e['message']}")
    
    assert len(events) == 4, f"Expected 4 events, got {len(events)}"
    assert events[0]['timestamp'] < events[1]['timestamp'], "Timestamps should be incremental"
    print("Test passed!")

if __name__ == "__main__":
    test_parsing()
