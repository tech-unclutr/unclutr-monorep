"""Shared Bolna webhook constants.

Bolna fires its call-lifecycle webhook incrementally — multiple events per call
(ringing → connected → speaking → terminal). Only terminal payloads carry the
final transcript / recording / duration. Handlers gate side effects (DB row
finalization, transcript stashing) on the terminal-state set below.
"""

# Status values Bolna emits on its final lifecycle webhook for a call. Any
# value in this set means "no further events expected — the row can be
# finalized and the transcript stashed."
TERMINAL_STATES: frozenset[str] = frozenset({
    "completed",
    "failed",
    "call-disconnected",
    "voicemail_detected",
    "no-answer",
    "busy",
    "canceled",
})


def is_terminal_status(status: str | None) -> bool:
    """Case-insensitive terminal-state check. None/empty → False."""
    return (status or "").lower() in TERMINAL_STATES
