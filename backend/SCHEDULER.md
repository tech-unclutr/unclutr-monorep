# Scheduler & Campaign Logic Documentation

## 1. Resetting Campaigns
We have added a **Reset Campaign** option that allows you to restart calling for leads that were not successfully contacted, while explicitly protecting users who have already completed a conversation.

**Endpoint:** `POST /campaign/{id}/reset`

**Logic:**
- **Preserves (Does NOT Call Again):**
  - `INTENT_YES` (User was interested)
  - `INTENT_NO` (User explicitly said Not Interested)
  - `SCHEDULED` (User asked to be called back at a specific time - we keep these active)
  - `CONSUMED` (Manually handled calls)
  
- **Resets (Will Call Again):**
  - `INTENT_NO_ANSWER` (User didn't pick up)
  - `FAILED` (Call failed technically)
  - `DIALING_INTENT` (Stuck calls)
  - `READY` / `ELIGIBLE` (Not yet processed)

## 2. Rescheduling
We have implemented a robust rescheduling system:
1.  **Detection**: The voice agent (Bolna) automatically detects phrases like "Call me back at 5pm" or "Can we speak tomorrow?".
2.  **Scheduling**: The system parses this time and sets the lead to `SCHEDULED` status with a specific timestamp.
3.  **Wake Up**: The Scheduler checks every minute for `SCHEDULED` items that are due.
4.  **Priority**: When a scheduled time arrives, the lead is promoted to **High Priority** (`Score: 999`) and placed at the front of the calling queue to be picked up by the next available agent.

## 3. Call States & Handling

| Status | Meaning | Action |
| :--- | :--- | :--- |
| `ELIGIBLE` | Fresh lead. | Waiting to be queued. |
| `READY` | Queued and ready for dialing. | Will be picked up by Queue Warmer. |
| `DIALING_INTENT` | Call initiated. | Active in the system. |
| `INTENT_YES` | **Success**. User is interested. | Marked as Complete. **Preserved on Reset.** |
| `INTENT_NO` | **Refusal**. User is not interested. | Marked as Complete. **Preserved on Reset.** |
| `INTENT_NO_ANSWER` | No Pickup / Voicemail. | **Retried on Reset.** |
| `FAILED` | Technical Failure. | **Retried on Reset.** |
| `SCHEDULED` | Callback requested. | **Protected**. Wakes up at scheduled time. |

## 4. Intent Handling (Yes)
When a user expresses interest (`INTENT_YES`):
- The system marks them as critical success.
- They are **removed from the automatic dialing pool** to prevent accidental callbacks.
- They are preserved during Campaign Re-runs/Resets.

## 5. Dynamic Queue & Team Capacity
- **Dynamic**: Yes. The `QueueWarmer` runs every minute (`scheduler.py`) to refresh the queue.
- **Team-Aware**: It monitors the number of *Active Calls* vs. your `MAX_CONCURRENCY` setting.
- **Buffers**: It maintains a small buffer of `READY` leads to ensure agents always have work, but doesn't overfill to keep the list fresh.
- **Priority**: Rescheduled calls automatically jump to the front of this dynamic queue when their time comes.
