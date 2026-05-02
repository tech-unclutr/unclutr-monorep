"""
Agent Prompt Generator — turn a study + cohort brief into a Bolna voice agent
prompt by filling the static template with parallel section-level LLM calls.

Public entry point:
    generate_agent_prompt(session, study, cohort) -> GeneratedPrompt

The module owns:
- input_builder.py — per-section JSON payload builders
- generator.py     — orchestrator: template read, section fan-out, assembly

Prompts:
- voice_agent_prompt.md                          — static template with three slots
- voice_agent_prompt_sections/additional_touchpoints.md — section meta-prompt
- voice_agent_prompt_sections/guardrails.md             — section meta-prompt
- voice_agent_prompt_sections/krq_block.md              — section meta-prompt (one per KRQ)
"""

from .generator import GeneratedPrompt, generate_agent_prompt

__all__ = ["generate_agent_prompt", "GeneratedPrompt"]
