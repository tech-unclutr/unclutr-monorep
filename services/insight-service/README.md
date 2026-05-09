# SquareUp Synthesis Demo

A live, browser-runnable Next.js demo of the SquareUp Stage-1 synthesis pipeline.
Voice transcripts in → ranked insights with verified verbatim evidence + routed actions out.

## What it does

Runs the same 4-agent pipeline as the SquareUp skill, but as a deployable web app:

```
Transcript → Extractor → Contradiction Detector → Severity Calibrator
                                                          ↓
                                         Cross-transcript Aggregator (deterministic)
                                                          ↓
                                                  Action Composer
```

Every quote in the rendered cards is span-verified against the source transcript
(`transcript[start:end] == verbatim`). The verifier auto-corrects offsets when the
LLM produces correct text but wrong character positions, and rejects truly hallucinated quotes.

## Three modes

| Mode | API key | Use case |
|---|---|---|
| **Playback** | none | Investor demo / live show — uses the pre-recorded Wildstone sample. Instant, free, no setup. |
| **Live** | yours, browser-stored | Real Anthropic calls. Paste your key once (saved in localStorage). |
| **Production** | server-side | For deployed brand dashboards. Set `ANTHROPIC_API_KEY` in `.env.local`. |

## Run it

```bash
cd synthesis-demo
npm install              # already done if you ran the build
npm run dev              # http://localhost:3000
```

For production mode (server-side key):

```bash
cp .env.local.example .env.local
# Edit .env.local — paste your key
npm run dev
```

For Live mode: open the page, switch the mode toggle to "Live", click "Set API key →" and paste.

## Demo flow

1. Open http://localhost:3000
2. Mode is "Playback" by default (no key needed) — click "Run synthesis"
3. Watch the 5-stage pipeline animate (Extract → Contradiction → Severity → Aggregate → Action)
4. See the SquareUp-branded insight cards render with severity meters, verified quotes, and routed actions

To run on real data: switch to "Live", paste your Anthropic key, paste a transcript (or click "Load sample"), click "Run synthesis."

## Cost

- Playback mode: $0
- Live mode: ~$0.15-0.20 per transcript (uses Opus 4.5 + Sonnet 4.5)
- Production mode: same as Live, billed to your server-side key

## Files

```
synthesis-demo/
├── app/
│   ├── page.tsx                   Main demo page
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── health/route.ts        Health + hasServerKey check
│       └── synthesize/route.ts    Single endpoint, dispatches by stage
├── components/
│   ├── ModeSelector.tsx           Three-mode toggle
│   ├── ApiKeyDialog.tsx           Live-mode key entry (localStorage)
│   ├── TranscriptInput.tsx        Paste / load-sample
│   ├── PipelineView.tsx           5-stage animated progress
│   └── InsightCard.tsx            Decision card (squareup-branded)
├── lib/
│   ├── prompts/                   Agent system prompts (same as skill)
│   ├── prompts.ts                 Loader (server-side fs)
│   ├── agents.ts                  Anthropic SDK wrapper per agent
│   ├── verify.ts                  Span verifier with auto-offset-correction
│   ├── aggregate.ts               Cross-transcript clustering (deterministic)
│   ├── pipeline.ts                Client-side orchestrator with progress events
│   ├── anthropic-client.ts        Mode-aware client factory
│   └── types.ts                   Shared TS types
├── public/
│   └── fixtures/                  Pre-computed sample run for playback mode
│       ├── extractor.json
│       ├── contradiction.json
│       ├── severity.json
│       ├── aggregated.json
│       ├── actions.json
│       └── transcript.txt         The original Wildstone transcript
├── sample-run/                    Python validation runner (gitignored outputs)
│   ├── run_pipeline.py
│   └── transcripts/
│       └── T1.txt
├── package.json
└── tailwind.config.ts             SquareUp brand tokens
```

## How the verifier works

The pipeline can't trust raw LLM output. Every span goes through `verifyAndCorrect()`:

1. **Tier 1 (exact)**: `transcript[start_char:end_char] === verbatim` → pass.
2. **Tier 2 (offset-corrected)**: verbatim found elsewhere in transcript → rewrite offsets, pass. (This handles the LLM's known weakness at counting characters.)
3. **Tier 3 (whitespace-tolerant)**: minor whitespace drift between verbatim and transcript → match in normalized form, recover original-text span, pass.
4. **Tier 4 (reject)**: verbatim is not in transcript at all → true hallucination, drop the span.

Themes/contradictions that lose all their spans get filtered out entirely — defense in depth.

## Adapting the prompts

The 4 agent prompts live in `lib/prompts/*.md`. They are the same files used by the Claude skill at `~/.claude/skills/squareup-synthesis/prompts/`. Edit them in either place and copy across — they should stay in sync.

## Production deployment

For deployment to `joinsquareup.com/synthesis`:

```bash
npm run build
npm start  # or deploy to Vercel/Modal/Railway
```

Set `ANTHROPIC_API_KEY` as an environment variable in your hosting platform. Default mode for paying brands should be "Production".

## Where this fits in the staged plan

This is **Stage 1** — the synthesis demo surface. Next stages (per the architecture roadmap):

- **Stage 2**: Bolna webhook + Supabase backend so transcripts auto-flow in
- **Stage 3**: HITL review UI (`/admin/review`) for approve/edit/reject
- **Stage 4**: Brand dashboard (`/brand/<id>/dashboard`)
- **Stage 5**: Specialist fine-tuned models replacing Claude calls one agent at a time

The current `lib/agents.ts` interface is designed so Stage 5 swap-ins are drop-in replacements per agent.
