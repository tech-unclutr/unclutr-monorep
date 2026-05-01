"""
Agent Prompt Generator — turn a study + cohort brief into a Bolna voice agent
prompt by feeding the structured brief through the meta-prompt LLM call.

Public entry point:
    generate_agent_prompt(session, study, cohort) -> str

The module owns:
- input_builder.py — assembles the meta-prompt's expected JSON input from DB rows
- generator.py     — loads the meta-prompt and runs the LLM call

The meta-prompt itself lives at:
    backend/app/services/intelligence/prompts/voice_agent_meta_prompt.md
"""

from .generator import generate_agent_prompt

__all__ = ["generate_agent_prompt"]
