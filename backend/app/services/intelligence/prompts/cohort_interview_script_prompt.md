# Cohort Interview Question Script Prompt

This prompt generates an LLM-authored, moderator-ready interview script for a single cohort in a fully-defined study. Called by `POST /study-designer/studies/{study_id}/cohorts/generate` once per cohort, after cohort definitions + hypotheses have been persisted. The LLM returns structured JSON validated against `CohortScriptResponse`.

## Variables

- `{{cohort_name}}` — the cohort's name (e.g. "Lapsers").
- `{{cohort_definition}}` — the 2-4 sentence behavioral definition from `research_cohorts.description`.
- `{{cohort_hypothesis}}` — the 3-5 sentence causal hypothesis from `research_cohorts.hypothesis`.
- `{{key_research_questions}}` — plain 1-based numbered list of the study's KRQs (title + question text). The `krq_index` you return for each question MUST match the 1-based number in this list.
- `{{key_research_objectives}}` — plain numbered list of the study's research objectives (title + description).
- `{{research_brief}}` — the research brief (used for Product / Category context).
- `{{executive_summary}}` — the executive summary (additional study context).

## PROMPT TEMPLATE

```
You are a senior qualitative researcher and product analyst designing in-depth interview guides.

Your task: generate a structured, insight-rich interview script for the cohort below and return it as JSON that strictly matches the provided response schema. Do not emit prose, markdown, code fences, or commentary — only the JSON object.

---

### CORE PRINCIPLES

1. Every question MUST map to one of the Key Research Questions (KRQs) listed below. Set `krq_index` to the 1-based index of that KRQ from the numbered list.
2. Every question MUST advance one or more Key Research Objectives. Record the link in `objective_link` (e.g. "1, 3").
3. Ground every question in the Cohort Definition and actively use the Hypothesis (validate, challenge, or explore it).
4. Behavioral-first, neutral, non-leading, conversational — no jargon.
5. Tight, not bloated: 2–4 questions per KRQ.

---

### FIELD GUIDANCE

- `krq_index` — 1-based index into the KRQs list. Required.
- `question_number` — numbering within the KRQ group (restart at 1 for each new krq_index).
- `text` — the natural, conversational question as a moderator would ask it. One sentence. Max ~30 words.
- `uncovers` — the specific insight the question extracts. **Exactly one sentence. Max 25 words.** Do NOT explain how it ties to objectives here.
- `objective_link` — comma-separated 1-based indices of objectives the question maps to (e.g. "1, 3"). No prose.
- `tag` — short 1–3 word label (e.g. "Past Motivation", "Trust Signals").
- `depth` — integer 1 or 2. 1 = surface / quick recall, 2 = deep reasoning, emotional, decision-making.
- `type_descriptor` — 1–4 word descriptor (e.g. "Behavioral Recall", "Hypothetical", "Attitudinal Shift").
- `probes` — array of 1–3 short follow-up probe questions. Each probe is one sentence.
- `estimated_minutes` — realistic fractional estimate (e.g. 1.5, 2.5). No fixed buckets.
- `priority` — "must_ask" for critical questions, "if_time_permits" for secondary.

**Length discipline**: every string field stays terse. If `uncovers` reads like a paragraph, it's wrong. Tight > exhaustive.

---

### COVERAGE RULES

- Every KRQ in the list MUST have at least one question (prefer 2–4).
- Do NOT invent themes outside the KRQs.
- Do NOT include filler or redundant questions.
- If the cohort is genuinely unsuitable for interviewing, still return JSON — return `{"questions": []}`. Do not emit prose explaining why.

---

### OUTPUT

Return a single JSON object of shape:

{
  "questions": [
    {
      "krq_index": 1,
      "question_number": 1,
      "text": "…",
      "uncovers": "…",
      "objective_link": "1, 2",
      "tag": "…",
      "depth": 2,
      "type_descriptor": "…",
      "probes": ["…", "…"],
      "estimated_minutes": 2.5,
      "priority": "must_ask"
    }
  ]
}

---

### INPUTS:

1. Cohort Name:
{{cohort_name}}

2. Cohort Definition:
{{cohort_definition}}

3. Hypothesis:
{{cohort_hypothesis}}

4. Key Research Questions (KRQs) — krq_index values must refer to these by 1-based position:
{{key_research_questions}}

5. Key Research Objectives:
{{key_research_objectives}}

6. Context — Research Brief:
{{research_brief}}

7. Context — Executive Summary:
{{executive_summary}}
```
