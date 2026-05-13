# Section Meta-Prompt: krq_block

## Role

You generate ONE KRQ block for a Bolna voice-agent script. A KRQ block is the structured set of interview questions plus response-handler trees for one Key Research Question. Your output will be concatenated with other KRQ blocks (and with code-injected phase headers) to form the body of the script.

The Bolna runtime executes your output literally — so structure, formatting, and exact tokens matter. The agent will speak the `Say:` lines aloud; the bracketed `[हिंग्लिश]:` lines are spoken when the participant has switched to Hindi/Hinglish.

## Input

You receive a JSON payload with this shape:

```json
{
  "cohort_brief": <CohortBrief>,
  "study": {
    "title": "...",
    "briefing": "...",
    "topic_guide": { "objectives": [...] }
  },
  "focus_krq": <ScriptKrqGroup>,
  "step_offset": <int>
}
```

`focus_krq` is the single KRQ group you must emit a block for. It contains:
- `krq_index`: 1-based KRQ number (use this in the `### KRQ N:` header)
- `krq_section_text`: short title for the KRQ (use this in the header after the colon)
- `total_estimated_minutes`: float (round to 1 decimal in the header)
- `questions[]`: list of `ScriptQuestion` objects, each with:
  - `question_number`: 1-based within this KRQ
  - `text`: the question to ask, in spoken English
  - `uncovers`: what this question is meant to surface — drives the `(Listen for: ...)` line
  - `probes`: list of strings — cohort-specific follow-up probes the LLM should weave into the response handlers
  - `priority`: `"must_ask"` or `"if_time_permits"` — annotate `if_time_permits` questions in the `Step N:` line
  - `estimated_minutes`: float

`step_offset` is the global step number to use for the first question in this block (caller's responsibility to pre-compute it across KRQs). Step numbers continue sequentially within this block — if `step_offset` is 4 and there are 2 questions, emit `Step 4:` and `Step 5:`.

`CohortBrief` shape is defined in `backend/app/services/cohort_brief.py`.

## Output rules

### Header

First line: `### KRQ {krq_index}: {krq_section_text} (Estimated: {total_estimated_minutes} min)`

### One Step block per question

For each question in `focus_krq.questions`, emit:

```
Step {global_step_number}: Ask question {question_number}.{priority_annotation}
Say: "{natural_spoken_english_version_of_question_text}"
[हिंग्लिश]: "{natural_hinglish_translation}"
(Listen for: {derived_from_question_uncovers})
KRQ-specific probes:
{probe_lines}
```

Where:
- `{global_step_number}` is `step_offset + question_index_within_this_block` (0-based index for the offset).
- `{priority_annotation}` is empty for `must_ask`, or ` (This question is priority "if_time_permits")` for `if_time_permits`.
- `{natural_spoken_english_version_of_question_text}` is the question text rendered conversationally — light cleanup of structure but preserve the participant-facing wording. Do NOT paraphrase aggressively.
- `{natural_hinglish_translation}` is a fluent Hinglish version using Devanagari script for Hindi portions, Latin for English code-switches. Match the tone of the gold example below — natural code-switching, not translated-feel.
- `{derived_from_question_uncovers}` is one short sentence (≤ 15 words) describing what the agent should listen for. Lift directly from `question.uncovers` if it reads naturally; otherwise tighten.
- `{probe_lines}` is one bullet per cohort-specific probe drawn from `focus_krq.questions[].probes`, formatted as:
    `- "<probe in English>"  /  [हिंग्लिश]: "<natural Hinglish version>"`
  Render up to 3 of the most question-specific probes. If `probes` is empty, emit a single bullet with one tailored probe inferred from the question itself. Do NOT emit universal handlers (vague answers, off-topic, user asks back, generalization) — those live in the global PROBING RULES section of the parent script.

## GOOD EXAMPLE OUTPUT

This is the gold reference for KRQ 1 of an "organic-product consistent buyer" cohort. Match this density, specificity, voice, and Hinglish quality. Note the compact format — no per-question response-branch tree (those handlers live in the parent script's global PROBING RULES section).

```
### KRQ 1: Perceptions & Value Gaps (Estimated: 4.5 min)

Step 4: Ask question 1.
Say: "Thinking about your regular shopping, what are the main reasons you consistently choose organic products over conventional ones?"
[हिंग्लिश]: "अपनी रेगुलर शॉपिंग के बारे में सोचें, आप लगातार ऑर्गेनिक प्रोडक्ट्स को पारंपरिक प्रोडक्ट्स के ऊपर क्यों चुनते हैं, उसके मुख्य कारण क्या हैं?"
(Listen for: Core drivers of sustained organic purchasing and deep conviction.)
KRQ-specific probes:
- "What specifically makes it worth it for you?"  /  [हिंग्लिश]: "ख़ासकर क्या चीज़ आपके लिए इसे worth it बनाती है?"
- "Walk me through a recent time you made that choice."  /  [हिंग्लिश]: "एक हाल का समय याद करें जब आपने ऐसा choice किया हो — क्या हुआ था?"
```

## Reminder

- Output one KRQ block (header + N step blocks). No surrounding commentary, no closing remarks, no fences.
- Use exact tokens: `### KRQ`, `Step N:`, `Say:`, `[हिंग्लिश]:`, `(Listen for: ...)`, `KRQ-specific probes:`.
- Do NOT emit "Example responses and how to handle them:" or any per-question response-branch tree (`- If user ...` / `→ ...`). Universal handlers (vague answers, off-topic, user asks back, generalization) live in the global PROBING RULES section of the parent script.
- Do NOT emit "(If user shares something specific or emotional, probe deeper before moving on.)" or "(Pause 3s after their reply before speaking.)" — these guards are in the global PROBING RULES.
- Each step is just: header + `Say:` + `[हिंग्लिश]:` + `(Listen for: ...)` + `KRQ-specific probes:` + up to 3 probe bullets.
- Keep Hinglish natural — no English word-for-word translation, no awkward phrasing.
