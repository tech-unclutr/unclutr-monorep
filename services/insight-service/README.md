# insight-service

Next.js 15 frontend for the SquareUp synthesis pipeline. Reads transcripts and synthesis results from a GCS bucket, runs cross-transcript synthesis on demand, and renders insight cards with verified verbatim quotes, debate-winning framings, and routed actions.

This is **one half** of a two-component system. The other half — `insights-engine` — is a headless Python service that processes new transcripts the moment they land in GCS. The two communicate exclusively through the GCS bucket. Neither one calls the other directly.

---

## What changed in this version

This branch (`feature/cross-runs-llm-clustering`) adds the LLM-based semantic clusterer to the cross-transcript synthesis path. Previously, cross-runs used Jaccard token-similarity, which couldn't bridge paraphrases like `longevity` ↔ `long-lasting hours` ↔ `5 hours`. Every theme stayed in its own cluster, every cross-run frequency stayed at `1/N`, and the P0/P1 priority gates were effectively unreachable.

Specifically:

- **`/api/transcripts/aggregate`** now calls a new `runClusterer` agent (Sonnet 4.5) before `aggregate()`, passing the LLM's cluster groupings as an override. Falls back to Jaccard with a console warning if the LLM call fails after retries.
- **`/transcripts/cross/<runId>`** rewritten with a 5-card stats bar (transcripts / mined / multi-transcript / surfaced / est-cost), a clustering-method badge (`LLM clusterer` green vs `Jaccard (legacy)` grey), a span-verification card, and purple-ringed cards for multi-transcript insights.
- **`/transcripts/cross`** (new) — index page listing all cross-runs in the `cross-runs/` GCS prefix, newest first.
- **Dead code removed:** the Vercel push webhook (`app/api/ingest/gcs-event/`), its OIDC verifier (`lib/pubsub-auth.ts`), and the legacy Python harness (`sample-run/`). All replaced by the Python `insights-engine`, which pulls from a Pub/Sub subscription instead of receiving pushes.

Estimated cost overhead: **+$0.02 per cross-run** (one Sonnet call with all per-transcript themes).

---

## Quick start (local dev)

Requires Node ≥ 18 and a GCS bucket already populated by `insights-engine` (or by manual upload).

```bash
cd services/insight-service
cp .env.local.example .env.local
# Fill in ANTHROPIC_API_KEY and GCP_SERVICE_ACCOUNT_KEY (single-line JSON, single-quoted)
npm install
npm run dev
# → http://localhost:3000
```

The three things to set in `.env.local`:

| Var | Format | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | Used by `/api/transcripts/aggregate` (cross-run trigger) and Live/Production modes on `/` |
| `GCP_SERVICE_ACCOUNT_KEY` | `'{"type":"service_account",…}'` | **Single-line JSON, wrapped in single quotes.** Single quotes preserve `\n` escapes inside `private_key` through the dotenv → `JSON.parse` round-trip |
| `GCS_TRANSCRIPTS_BUCKET` | `your-bucket-name` | No `gs://` prefix |

Sanity check after `npm run dev`:

```bash
curl http://localhost:3000/api/health    # → {"ok": true, …}
```

---

## URL map

| Route | Purpose |
|---|---|
| `/` | Live/Playback/Production synthesis demo (paste a transcript, run in-browser) |
| `/transcripts` | List of `inbox/*.txt` with status pills. Trigger cross-run from here |
| `/transcripts/<id>` | Single-transcript result viewer |
| `/transcripts/cross` | **Index of all cross-runs** (newest first) |
| `/transcripts/cross/<runId>` | Single cross-run viewer with the wardrobe-test-style insight cards |
| `/api/health` | Diagnostic: `hasServerKey` + GCS reachability |
| `/api/transcripts` (GET) | List inbox/ + status from results/ |
| `/api/transcripts/<id>` (GET) | One per-transcript result JSON |
| `/api/transcripts/cross` (GET) | List cross-runs/ |
| `/api/transcripts/cross/<runId>` (GET) | One cross-run JSON |
| `/api/transcripts/aggregate` (POST) | Trigger a cross-run (LLM clusterer + debate + action composer) |
| `/api/synthesize` (POST) | In-browser per-stage pipeline endpoint (used by Live/Production on `/`) |

---

## Architecture

Two components, glued by one GCS bucket. Neither calls the other directly.

```
[ Bolna / manual upload ]
            │
            ▼
   gs://<bucket>/inbox/T*.txt
            │
            │  (GCS Object-Finalize notification)
            ▼
   Pub/Sub topic: transcript-uploaded-dev
            │
            ▼
   Pull subscription: insights-puller
            │
            ▼
┌──────────────────────────────────┐
│ insights-engine (Python)         │
│ python -m insights subscribe     │
│   extractor → contradiction ∥    │
│   severity → (clusterer) →       │
│   aggregate → framer×3 + judge   │
│   → action                       │
└──────────────────────────────────┘
            │
   ┌────────┴──────────┐
   ▼                   ▼
results/<id>.json   cross-runs/<run_id>.json
            │
            └─── read by ───▶ insight-service (this repo)
                              localhost:3000 / Vercel
```

**Per-transcript runs** are triggered automatically by Pub/Sub when a new `inbox/<id>.txt` is uploaded. They land in `results/<id>.json`.

**Cross-runs** are triggered from `/transcripts` in this UI (`POST /api/transcripts/aggregate`). The endpoint:
1. Reads `results/<id>.json` for each selected transcript (cached per-transcript stages — extractor, contradiction, severity)
2. Runs `runClusterer` over the union of themes — single Sonnet call, ~$0.02
3. Runs `aggregate()` with the LLM clusters as override
4. Filters top-N at P0/P1/P2
5. Runs 3-agent debate + Opus judge per surfaced insight
6. Runs action composer
7. Writes `cross-runs/<run_id>.json`

**Why two components?** The Python engine was designed to run independently of Vercel — it's the canonical batch processor that auto-fires on uploads. The Next.js service is the *view* layer plus on-demand cross-run trigger. Either can run without the other: you can use `insights-engine` headless, you can run the UI against a bucket that nothing's writing to.

---

## GCS bucket layout (the wire contract)

```
gs://<bucket>/
├── inbox/                          ← drop transcripts here as <transcript_id>.txt
│   ├── T1.txt
│   └── T2.txt
│
├── results/                        ← per-transcript pipeline outputs
│   ├── T1.json                     ← success: full pipeline output
│   ├── T1.error.json               ← failure: {error, stage, timestamp}
│   └── T2.json
│
└── cross-runs/                     ← cross-transcript synthesis outputs
    └── cross_<utc-timestamp>_<ids>.json
```

This layout is the contract. Both components must use the same prefixes and key names, or they'll fail to find each other's writes. The Next.js side defines the canonical names in `lib/gcs.ts`:

```ts
const INBOX_PREFIX     = "inbox/";
const RESULTS_PREFIX   = "results/";
const CROSS_RUNS_PREFIX = "cross-runs/";
```

The Python `insights/gcs.py` mirrors these exactly.

---

## Setting up a GCS inbox from scratch

If you're integrating a fresh GCP project (or migrating to a new bucket), follow these steps in order. Estimated total time: 10–15 minutes.

### 1. Prerequisites

- A Google Cloud project (call it `$PROJECT`)
- `gcloud` CLI installed and authenticated with an account that has Owner or Editor on the project
- Decide on a bucket name and region. Bucket names are globally unique. Pick a region close to your Vercel deployment (or `us-central1` if undecided)

```bash
export PROJECT="your-gcp-project-id"
export BUCKET="your-bucket-name"
export REGION="us-central1"           # or bom1, eu-west1, etc.
export TOPIC="transcript-uploaded"
export PULL_SUB="insights-puller"
export SA="insight-ingest"

gcloud config set project $PROJECT
```

### 2. Enable required APIs

```bash
gcloud services enable storage.googleapis.com pubsub.googleapis.com
```

### 3. Create the bucket

Uniform IAM (not legacy ACLs), public access blocked.

```bash
gcloud storage buckets create gs://$BUCKET \
  --location=$REGION \
  --uniform-bucket-level-access \
  --public-access-prevention
```

### 4. Create the Pub/Sub topic

```bash
gcloud pubsub topics create $TOPIC
```

### 5. Wire GCS notifications → Pub/Sub

`OBJECT_FINALIZE` fires every time a new object is created (or overwritten). We scope it to the `inbox/` prefix so we don't get duplicate fires when the pipeline writes to `results/`.

```bash
gcloud storage buckets notifications create gs://$BUCKET \
  --topic=$TOPIC \
  --event-types=OBJECT_FINALIZE \
  --object-prefix=inbox/ \
  --payload-format=json
```

You'll also need to grant the GCS service agent permission to publish to the topic — Google's docs cover this but `gcloud` usually does it for you automatically on first use.

### 6. Create the pull subscription

`--ack-deadline=600` (10 minutes) is generous; the Python pipeline runs `120s` per transcript, but `600s` gives margin for retries and large transcripts.

```bash
gcloud pubsub subscriptions create $PULL_SUB \
  --topic=$TOPIC \
  --ack-deadline=600
```

### 7. Create the service account

Scoped narrowly: read/write the bucket, pull from the subscription. Nothing more.

```bash
gcloud iam service-accounts create $SA \
  --display-name="Insight Ingest Service Account"

export SA_EMAIL="${SA}@${PROJECT}.iam.gserviceaccount.com"
```

### 8. Grant minimum-needed IAM

```bash
# Bucket: full object admin (read inbox/, write results/ and cross-runs/, list, delete error files)
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectAdmin"

# Pull subscription: subscriber role
gcloud pubsub subscriptions add-iam-policy-binding $PULL_SUB \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/pubsub.subscriber"
```

### 9. Download the SA key JSON

```bash
mkdir -p ~/.gcp
gcloud iam service-accounts keys create ~/.gcp/insight-ingest-key.json \
  --iam-account=$SA_EMAIL
```

Keep this file secret. Don't commit it. Don't paste it into Slack.

### 10. Configure `insights-engine` (the Python puller)

In the `insights-engine/.env`:

```dotenv
ANTHROPIC_API_KEY=sk-ant-...

GCP_SERVICE_ACCOUNT_KEY=/path/to/insight-ingest-key.json    # file path OR inline JSON
GCP_PROJECT_ID=your-gcp-project-id
GCS_TRANSCRIPTS_BUCKET=your-bucket-name
PUBSUB_SUBSCRIPTION=projects/your-gcp-project-id/subscriptions/insights-puller

DEFAULT_BRAND_CONTEXT=
DEFAULT_ONBOARDING_PLAN=
```

Then:

```bash
cd insights-engine
pip install -r requirements.txt
python -m insights subscribe          # long-running puller
```

### 11. Configure `insight-service` (this repo)

`.env.local`:

```dotenv
ANTHROPIC_API_KEY=sk-ant-...

# Single-line JSON, wrapped in single quotes (preserves \n in private_key)
GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"insight-ingest@...","...":"..."}'

GCP_PROJECT_ID=your-gcp-project-id
GCS_TRANSCRIPTS_BUCKET=your-bucket-name
NEXT_PUBLIC_BUCKET_LABEL=your-bucket-name
```

The trick with the SA key: convert the JSON file to single-line and wrap in single quotes:

```bash
python -c "import json,sys; print(\"'\" + json.dumps(json.load(open(sys.argv[1])), separators=(',',':')) + \"'\")" ~/.gcp/insight-ingest-key.json
```

Then paste the output (including outer quotes) as the `GCP_SERVICE_ACCOUNT_KEY=` value.

```bash
cd services/insight-service
npm install
npm run dev
# → http://localhost:3000
```

### 12. End-to-end smoke test

```bash
# Drop a transcript
gcloud storage cp ./T1.txt gs://$BUCKET/inbox/T1.txt

# In the puller terminal you should see:
# [ingest] msg=… eventType=OBJECT_FINALIZE bucket=… name=inbox/T1.txt
# [pipeline] ════ start ════ …
# [pipeline] ════ DONE ════ …
# [ingest] T1: N insights, …s, …in/…out

# In the browser, refresh /transcripts — T1 should now show status="Done"
```

For a cross-run smoke test: upload at least two transcripts, select both on `/transcripts`, click **Run cross-transcript**. You'll get redirected to `/transcripts/cross/cross-<timestamp>`. Look for the green **LLM clusterer** badge in the metadata strip.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `GCP_SERVICE_ACCOUNT_KEY is not valid JSON` in browser | `.env.local` uses double quotes — the `\n` escapes got eaten. Switch to single quotes |
| `401 Request had invalid authentication credentials` in Python puller | SA credentials missing scopes. The Python `gcs.py` must pass `scopes=["https://www.googleapis.com/auth/cloud-platform"]` to `from_service_account_info()` |
| Puller logs identity correctly but never receives messages | Subscription not bound to topic, or SA missing `roles/pubsub.subscriber` on the subscription |
| `Run cross-transcript` button greyed out | Need ≥1 selected transcript with status `Done` |
| Cross-run completes but all insights show 25% / 1-of-4 | Old Jaccard clustering. The page should show a yellow warning banner explaining this and pointing to re-run |
| Cross-run completes but no insights surface | All themes single-transcript, so frequency stays at 1/N and P0/P1 are unreachable. Either widen filter to include P3 or use the LLM clusterer (this branch ships it on by default) |
| `Task exception was never retrieved: Event loop is closed` in puller | Cosmetic httpx cleanup warning, fixed in `insights/pipeline.py` by calling `await client.close()` before return |

---

## File layout

```
services/insight-service/
├── README.md                              ← this file
├── INSIGHT_SERVICE.md                     ← legacy design doc, kept for history
├── DEPLOY.md                              ← legacy Vercel deploy notes
├── .env.local / .env.local.example        ← config (real one gitignored)
├── package.json / tsconfig.json / next.config.mjs
├── tailwind.config.ts / postcss.config.mjs
├── vercel.json                            ← Vercel deploy config (legacy path)
│
├── app/
│   ├── layout.tsx, globals.css, page.tsx  ← root + live-demo page
│   ├── api/
│   │   ├── health/route.ts                ← diagnostic
│   │   ├── synthesize/route.ts            ← in-browser pipeline stages
│   │   └── transcripts/
│   │       ├── route.ts                   ← GET list inbox/+results/
│   │       ├── [id]/route.ts              ← GET one result
│   │       ├── aggregate/route.ts         ← POST trigger cross-run (LLM clustered)
│   │       └── cross/
│   │           ├── route.ts               ← GET list cross-runs/        [NEW]
│   │           └── [runId]/route.ts       ← GET one cross-run
│   └── transcripts/
│       ├── page.tsx                       ← inbox list + cross-run trigger
│       ├── [id]/page.tsx                  ← single-transcript view
│       └── cross/
│           ├── page.tsx                   ← cross-run INDEX            [NEW]
│           └── [runId]/page.tsx           ← single cross-run view      [REWRITTEN]
│
├── components/                            ← React UI primitives
│   ├── InsightCard.tsx, PipelineView.tsx
│   ├── ModeSelector.tsx, ApiKeyDialog.tsx
│   ├── TranscriptInput.tsx, OnboardingInput.tsx
│   ├── InsightControls.tsx, TrustPanel.tsx
│   └── FeedbackWidget.tsx
│
├── lib/                                   ← server-side logic
│   ├── agents.ts                          ← Anthropic SDK wrappers (includes runClusterer)  [UPDATED]
│   ├── aggregate.ts                       ← clustering + cross-transcript aggregation       [UPDATED]
│   ├── pipeline.ts                        ← in-browser orchestrator (Live/Production modes)
│   ├── pipeline-server.ts                 ← server-side orchestrator (kept for type exports)
│   ├── anthropic-client.ts                ← mode-aware client factory
│   ├── gcs.ts                             ← GCS read/write (listTranscripts, getCrossRun, putCrossRun, …)
│   ├── verify.ts                          ← 4-tier span verifier
│   ├── prompts.ts                         ← markdown prompt loader                          [UPDATED]
│   ├── prompts/
│   │   ├── extractor.md, contradiction.md, severity.md, action.md
│   │   ├── framer.md, judge.md
│   │   └── clusterer.md                                                                     [NEW]
│   └── types.ts                                                                              [UPDATED]
│
└── public/
    └── fixtures/                          ← pre-computed sample for Playback mode
```

---

## Cost model

Per cross-run on 4 transcripts (all already cached per-transcript):

| Stage | Calls | Model | Approx cost |
|---|---|---|---|
| Clusterer | 1 | Sonnet 4.5 | $0.02 |
| Debate framers (3 × top-5 insights) | 15 | Sonnet 4.5 | $0.13 |
| Debate judges (1 × top-5) | 5 | Opus 4.5 | $0.13 |
| Action composer | 1 | Sonnet 4.5 | $0.02 |
| **Total** | **22 calls** | | **~$0.30** |

Per-transcript single runs (triggered by the Pub/Sub puller, not this UI) cost ~$0.30 each, on top of which you re-pay nothing for cross-runs (they read cached `results/<id>.json`).

Live-mode demos on `/` cost roughly the same as a single per-transcript run.

---

## Related

- **`insights-engine`** — the Python puller. Lives separately from this monorepo today. Talk to it through `gs://<bucket>/inbox/`
- **`INSIGHT_SERVICE.md`** in this directory — older design doc; the bits about the Vercel push webhook are now historical
- **Anthropic API docs** for current model IDs and pricing
- **`gcloud storage`** / **`gcloud pubsub`** for the infra commands above

---

## Known caveats

- **Live-mode aggregate stage** (`/api/synthesize` with `stage: "aggregate"`) still uses Jaccard. The LLM clusterer is only wired into the GCS-backed cross-run path. Low impact because Live mode is usually 1 transcript; port it if you start using Live for multi-transcript work
- **`lib/pipeline-server.ts`** has a `runServerPipeline()` function that is no longer called from anywhere (its caller, `app/api/ingest/`, was removed). The file is kept because its `ServerPipelineResult` type is still consumed by two other files. If you resurrect it as an entry point, remember to thread `runClusterer` through — it currently still calls `aggregate()` without an override
- **All 5 debate winners are usually `balanced`** in practice. The 3-agent debate may be over-engineered; consider whether `conservative` + `aggressive` are earning their ~$0.07 cost or just acting as decoys for the judge
- **`clustering_method`** is a new field in the aggregated metadata. Old cross-run JSONs (written before this branch) won't have it; the UI defaults to `"jaccard"` for those and shows the legacy badge

---

## License / ownership

Internal to SquareUp. Not for public distribution.
