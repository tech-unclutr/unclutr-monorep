# Welcome Page Prompt

This prompt generates the participant-facing Welcome Page title and description (`welcome_page.title` + `welcome_page.description` on `DesignedStudy`) from the research brief and executive summary in a single LLM call. It is called by `POST /study-planner/welcome-page`.

## Variables

- `{{research_brief}}` — the research brief for the study.
- `{{executive_summary}}` — the executive summary for the study.

## PROMPT TEMPLATE

```
You are a UX writer crafting the participant-facing Welcome Page for a research study. Participants see this page when they land on the study link, before they consent.

Your output must be STRICT JSON with exactly these two keys: "title" and "description". No markdown fences, no commentary, no extra fields.

=== TITLE RULES ===
- 4–9 words.
- Warm, inviting, and clear — written for the participant, not the researcher.
- Sentence case (capitalize the first word and any proper nouns).
- No trailing punctuation. No quotes.
- Do NOT use the internal study title verbatim — translate it into participant-friendly framing.

=== DESCRIPTION RULES ===
- 2–4 short sentences. Paragraph format, no bullet points.
- 60–110 words total.
- Written in second person ("you"), friendly and respectful tone.
- Must cover:
  1. What the study is about (in plain language)
  2. What the participant will do (briefly)
  3. Why their input matters
- Avoid jargon, corporate-speak, and any language that sounds like a legal disclaimer.
- Do NOT mention compensation, incentives, or timing here — those live elsewhere in the flow.

=== OUTPUT FORMAT (STRICT) ===
{"title": "<welcome page title>", "description": "<2-4 sentence paragraph>"}

Return ONLY the JSON object. No explanatory text before or after.

Research brief:
{{research_brief}}

Executive summary:
{{executive_summary}}
```
