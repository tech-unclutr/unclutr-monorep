# Insight Service — GCS-driven Synthesis Pipeline

> Production demo: **https://synthesis-demo.vercel.app**
> GCP project: `squareup-492617` · region `asia-south1` (Mumbai)

This document is the **single source of truth** for the Insight Service:
what it is, what's been provisioned on GCP, every command run during setup,
the Vercel deploy config, the cost model, and **every known issue / open
error** we have not yet fixed. It deliberately repeats nothing in the
service-internal `README.md` (which covers the pipeline architecture and
local dev) — this doc is about **integration + operations**.

---

## 1. What this service does

A Bolna voice-call transcript lands in a GCS bucket. The bucket fires an
Object-Finalize notification to a Pub/Sub topic. The topic's push
subscription POSTs to a Vercel-hosted endpoint that runs the synthesis
pipeline (6-agent extraction → cross-transcript aggregation → 3-agent
debate → action composer) and writes the result JSON back to the same
bucket. A separate UI surfaces the transcripts and their insights to the
brand.

```
[ Bolna call ends — eventually wired in by post-execution-service ]
                         ↓ uploads .txt
GCS bucket: gs://squareup-transcripts-dev/inbox/<id>.txt
                         ↓ OBJECT_FINALIZE notification
Pub/Sub topic: transcript-uploaded-dev
                         ↓ push subscription with OIDC auth
Vercel: POST https://synthesis-demo.vercel.app/api/ingest/gcs-event
                         ↓
   verifyOIDCToken → fetchTranscript → runServerPipeline
                         ↓
   writeResult → gs://squareup-transcripts-dev/results/<id>.json
                         ↓
UI:  /transcripts             list view
     /transcripts/<id>        per-transcript detail (insights + debate)
     /transcripts/cross/<id>  cross-transcript synthesis
```

---

## 2. GCP infrastructure provisioned (exhaustive)

Everything below was created against project `squareup-492617`. Each
command is the **exact command run during setup**. Re-run them only if
you're rebuilding from scratch in a different project.

### 2.1 Required APIs enabled

```bash
gcloud services enable storage.googleapis.com pubsub.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com
```

### 2.2 GCS bucket

```bash
gcloud storage buckets create gs://squareup-transcripts-dev \
  --project=squareup-492617 \
  --location=asia-south1 \
  --uniform-bucket-level-access \
  --public-access-prevention
```

Layout used by the service:

```
gs://squareup-transcripts-dev/
├── inbox/         <-- uploads land here. ONLY this prefix triggers ingest.
│   └── <id>.txt
├── results/
│   ├── <id>.json         per-transcript pipeline output
│   └── <id>.error.json   per-transcript error (if pipeline failed)
└── cross-runs/
    └── <runId>.json      cross-transcript synthesis output
```

### 2.3 GCS service agent (one-time provisioning)

The bucket-events publisher account doesn't exist by default. Force
provisioning:

```bash
gcloud storage service-agent --project=squareup-492617
# → returns: service-223432117369@gs-project-accounts.iam.gserviceaccount.com
```

(`223432117369` is the project number for `squareup-492617`.)

### 2.4 Pub/Sub topic + GCS publisher binding

```bash
gcloud pubsub topics create transcript-uploaded-dev --project=squareup-492617

# allow GCS service agent to publish to the topic
gcloud pubsub topics add-iam-policy-binding transcript-uploaded-dev \
  --member=serviceAccount:service-223432117369@gs-project-accounts.iam.gserviceaccount.com \
  --role=roles/pubsub.publisher \
  --project=squareup-492617
```

### 2.5 GCS → Pub/Sub notification

Filtered to **inbox/ prefix only** (otherwise the result-writes from the
ingest endpoint would re-trigger ingest in an infinite loop):

```bash
gcloud storage buckets notifications create gs://squareup-transcripts-dev \
  --topic=projects/squareup-492617/topics/transcript-uploaded-dev \
  --event-types=OBJECT_FINALIZE \
  --object-prefix=inbox/
```

> **NOTE / open error #1**: A first attempt accidentally created an
> additional notification with NO prefix filter (id `1`). It was deleted
> with `gsutil notification delete projects/_/buckets/squareup-transcripts-dev/notificationConfigs/1`.
> The remaining notification has id `2` with `object_name_prefix: inbox/`.
> If you ever see two notifications appear after re-running the create
> command, the unfiltered one **must** be deleted to prevent feedback loops.

### 2.6 Service account for the insight service

```bash
gcloud iam service-accounts create insight-ingest \
  --display-name="Insight Service Ingest" \
  --project=squareup-492617

gcloud storage buckets add-iam-policy-binding gs://squareup-transcripts-dev \
  --member=serviceAccount:insight-ingest@squareup-492617.iam.gserviceaccount.com \
  --role=roles/storage.objectAdmin
```

### 2.7 Service account key (with org-policy override)

The `constraints/iam.disableServiceAccountKeyCreation` org policy blocks
key creation by default (correctly — long-lived JSON keys are the #1 GCP
credential leak vector). We **temporarily disabled it**, created the key,
then re-enabled it.

```bash
# 1. disable the constraint at project level
gcloud resource-manager org-policies disable-enforce \
  constraints/iam.disableServiceAccountKeyCreation --project=squareup-492617

# 2. wait ~60s for propagation, then create the key
gcloud iam service-accounts keys create insight-ingest-key.json \
  --iam-account=insight-ingest@squareup-492617.iam.gserviceaccount.com \
  --project=squareup-492617

# 3. re-enable the constraint
gcloud resource-manager org-policies enable-enforce \
  constraints/iam.disableServiceAccountKeyCreation --project=squareup-492617
```

The key file currently lives at `C:\Users\nimay\.gcp\insight-ingest-key-v2.json`
(local only — never committed). The first key created during testing
(`801d99d51f8f7b2040d690d8f159e7ef0fa969ae`) was inadvertently exposed in
chat history and **immediately revoked** with:

```bash
gcloud iam service-accounts keys delete 801d99d51f8f7b2040d690d8f159e7ef0fa969ae \
  --iam-account=insight-ingest@squareup-492617.iam.gserviceaccount.com \
  --project=squareup-492617
```

> **NOTE / open security issue #2**: Long-lived JSON keys are still in
> use. Migrating to **Workload Identity Federation** (Vercel issues OIDC
> tokens, GCP exchanges them for short-lived access tokens — no JSON key
> on the Vercel side) is the right long-term path. Track as a hardening
> task post-pilot.

### 2.8 Pub/Sub → Vercel push subscription

Pub/Sub uses the `insight-ingest` service account to mint OIDC tokens
when calling our endpoint. The Pub/Sub *service agent* must be allowed to
mint tokens for that account:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  insight-ingest@squareup-492617.iam.gserviceaccount.com \
  --member=serviceAccount:service-223432117369@gcp-sa-pubsub.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountTokenCreator \
  --project=squareup-492617
```

Then create the subscription pointing at the Vercel endpoint:

```bash
gcloud pubsub subscriptions create transcript-uploaded-dev-vercel \
  --topic=transcript-uploaded-dev \
  --push-endpoint=https://synthesis-demo.vercel.app/api/ingest/gcs-event \
  --push-auth-service-account=insight-ingest@squareup-492617.iam.gserviceaccount.com \
  --ack-deadline=600 \
  --project=squareup-492617
```

`ack-deadline=600` (10 min) is the maximum allowed push deadline; it
gives the Vercel function up to 10 min to ack, **but** Vercel Hobby kills
functions at 60s — so in practice the function must complete within 60s
or the message is redelivered after the ack expiry.

---

## 3. Vercel deployment

**URL**: https://synthesis-demo.vercel.app
**Project**: `nimayshah2022-7408s-projects/synthesis-demo`
**Region**: `bom1` (Mumbai)
**Function timeout**: 60s (Hobby tier max — `vercel.json` declares `maxDuration: 60`)

### Required environment variables

| Name | Purpose | Sensitive? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Used by all agent calls | **YES** |
| `GCP_SERVICE_ACCOUNT_KEY` | Full JSON of `insight-ingest-key-v2.json` (single-line OK; client parses) | **YES** |
| `GCP_PROJECT_ID` | `squareup-492617` | no |
| `GCS_TRANSCRIPTS_BUCKET` | `squareup-transcripts-dev` | no |
| `NEXT_PUBLIC_BUCKET_LABEL` | UI display label, defaults to bucket name | no |
| `PUBSUB_PUSHER_EMAIL` | `insight-ingest@squareup-492617.iam.gserviceaccount.com` — pins which SA can push | no |

Optional:

| Name | Purpose |
|---|---|
| `PUBSUB_OIDC_AUDIENCE` | Pin the OIDC audience to a specific URL. Currently unset (verifier accepts default audience). |
| `PUBSUB_DEV_SHARED_SECRET` | Local-dev bypass for OIDC. Never set in production. |
| `DEFAULT_BRAND_CONTEXT` | Brand line auto-applied to ingested transcripts |
| `DEFAULT_ONBOARDING_PLAN` | Onboarding plan auto-applied to ingested transcripts |

### Redeploy command (after code changes)

```bash
cd services/insight-service
npx vercel --prod
```

---

## 4. Pipeline + cost model

### Per-transcript ingest (auto-triggered by GCS upload)

| Stage | Model | ~tokens | cost |
|---|---|---|---|
| Grounded Extractor | Sonnet 4.5 | 5K in / 3K out | ~$0.06 |
| Contradiction Detector | Sonnet 4.5 | 7K in / 1.3K out | ~$0.04 |
| Severity Calibrator | Sonnet 4.5 | 7K in / 2K out | ~$0.05 |
| Cross-transcript Aggregator | (deterministic, no LLM) | 0 | $0 |
| Debate × top-3 (3 framers + 1 judge each) | Sonnet framers + Opus judge | mixed | ~$0.10 |
| Action Composer | Sonnet 4.5 | 8K in / 1.5K out | ~$0.05 |
| **Per-transcript total** | | | **~$0.30** |

> Cost dropped from an earlier ~$1.00 by switching Extractor / Contradiction
> / Action from Opus 4.5 → Sonnet 4.5. Judge stays on Opus (cross-comparison
> nuance matters there). Severity was already Sonnet.

### Cross-transcript run (manually triggered)

Reuses cached per-transcript outputs from GCS. Only the aggregator
(deterministic, free), the debate stage on top-N insights, and the
action composer run.

| Stage | Model | cost |
|---|---|---|
| Aggregator | (deterministic) | $0 |
| Debate × top-5 | Sonnet + Opus | ~$0.20 |
| Action Composer | Sonnet | ~$0.05 |
| **Cross-run total** | | **~$0.25–0.30** *regardless of transcript count* |

---

## 5. Known errors / open issues (do not deploy to a paying brand without addressing)

### 5.1 Vercel Hobby 60-second timeout

The full pipeline (6 agents + debate on top-3 + action composer) currently
fits in **~45–55 seconds** for one ~5KB transcript with the cost-cut
applied. There is **no margin for slower runs** (rate-limited Anthropic
responses, larger transcripts, or future feature additions).

If the function times out: Pub/Sub redelivers after the `ack-deadline`
expires, retrying indefinitely until the message age exceeds the topic's
retention period. **Each retry burns Anthropic credits** for the partial
work it does before timing out.

**Mitigation paths** (in order of preference):
1. Move ingest endpoint to **Cloud Run** (300s+ timeout, GCP-native auth — no
   JSON key needed if WIF is set up).
2. Upgrade Vercel to Pro ($20/mo, 300s timeout).
3. Make the ingest endpoint **async** — return 200 immediately, kick off
   pipeline in a background queue. Requires a separate worker
   (Inngest, Trigger.dev, or self-hosted).

### 5.2 The seek-to-far-future trap

To drain a stuck queue, we used:
```bash
gcloud pubsub subscriptions seek transcript-uploaded-dev-vercel \
  --time=2030-01-01T00:00:00Z --project=squareup-492617
```
This **also acked all future uploads up to 2030**. The fix when this
happens: seek back to a recent past timestamp:
```bash
gcloud pubsub subscriptions seek transcript-uploaded-dev-vercel \
  --time=2026-05-09T21:00:00Z --project=squareup-492617
```

> **Always seek to "now-ish", never far-future.** Document this for ops.

### 5.3 No dead-letter queue

Permanent failures retry until message age exceeds retention (default
7 days). For repeated bad data, this means up to 7 days of wasted
function invocations. **Add a dead-letter topic + max-delivery-attempts
before going to paid pilots.**

### 5.4 Long-lived JSON service-account key

`GCP_SERVICE_ACCOUNT_KEY` is a long-lived JSON. If the Vercel
environment is ever compromised, this key gives full
`storage.objectAdmin` on the transcripts bucket. Migration to **Workload
Identity Federation** is the proper fix (no JSON, short-lived tokens).

### 5.5 Idempotency only checks the success file

`/api/ingest/gcs-event` skips processing only if `results/<id>.json`
exists. If only `results/<id>.error.json` exists, the function will
re-run on next delivery. This is by design (so retries can recover),
but means **a permanently bad transcript will keep retrying** until
manually intervened (delete the inbox file, or add a dead-letter queue
per #5.3).

### 5.6 No `PUBSUB_OIDC_AUDIENCE` enforcement

The OIDC verifier accepts any audience by default. Combined with
`PUBSUB_PUSHER_EMAIL` pinning, this is acceptable security — only
tokens signed for `insight-ingest@...` are honored. **Improvement**:
set `PUBSUB_OIDC_AUDIENCE` to the exact endpoint URL and recreate the
push subscription with `--push-auth-token-audience=<same URL>`.

### 5.7 Transcript ID must be filename-safe

Object names in `inbox/` are mapped to transcript IDs by stripping
`inbox/` and `.txt`. The remaining ID must match `[A-Za-z0-9_\-./]+`.
Files outside this pattern (e.g., spaces, parentheses, non-ASCII) are
**silently ignored**. Either rename before upload, or relax the regex
in `lib/gcs.ts:parseTranscriptIdFromGcsName`.

### 5.8 No cross-runs list view

Cross-run results write to `gs://.../cross-runs/<runId>.json`, but the
UI has no list page yet — you can only reach a cross-run via the URL
returned from triggering the run (or by manually constructing
`/transcripts/cross/<runId>`). **Adding `app/transcripts/cross/page.tsx`
that lists `cross-runs/` would close this**.

### 5.9 No real-time updates

The transcripts list page polls `/api/transcripts` every 5s. For a
proper brand dashboard, swap to **Server-Sent Events** (or move
results to **Firestore** with real-time listeners — the cost is similar
and the UX is dramatically better).

### 5.10 Cost spikes on retry storms

A single bad transcript can burn $1–3 in retries before the
60-second-timeout is detected manually. **Until #5.1 and #5.3 are
fixed**, watch the Vercel logs after every upload for the first ~2 min.
If you see repeated 504s, run the drain command immediately:
```bash
gcloud pubsub subscriptions seek transcript-uploaded-dev-vercel \
  --time=$(date -u +"%Y-%m-%dT%H:%M:%SZ") --project=squareup-492617
```
(Use a fresh timestamp — see the gotcha in #5.2.)

### 5.11 JSON parse retry budget capped at 2

`lib/agents.ts:callAgent` retries up to 2× on parse failure with a
"strict JSON" nudge. If all 3 attempts fail, the run errors. This was
added after observing one model glitch (`"start_char": 2aborrar`) that
broke a real run. Switching to **Anthropic's tool-use API** (forced
schema-validated JSON via tool calls) would eliminate this class of
errors entirely.

### 5.12 No cleanup of `cross-runs/` or `results/`

Both prefixes grow without bound. For long-term ops, set a **lifecycle
rule** on the bucket: e.g., delete `cross-runs/` objects > 90 days,
move `results/` > 180 days to NEARLINE storage class.

### 5.13 Auth identity is hardcoded to a single service account

If we add a second worker or migrate to Cloud Run, we'll need a second
push subscription (or change the existing one's
`--push-auth-service-account`). Track in deployment runbook.

---

## 6. How to verify the loop works (smoke test)

```bash
# 1. Verify env vars are set on Vercel
curl -sf https://synthesis-demo.vercel.app/api/health | jq

# 2. Upload a sample transcript
gcloud storage cp ./services/insight-service/sample-run/transcripts/T1.txt \
  gs://squareup-transcripts-dev/inbox/smoke-T1.txt

# 3. Watch the page (or poll the API)
open https://synthesis-demo.vercel.app/transcripts
# Within ~45s: smoke-T1 should flip from Processing → Done
# Click into it → see insights, debate scores, action cards

# 4. Once 2+ are done, run cross-transcript synthesis
# Visit /transcripts → tick checkboxes → click "Run cross-transcript"
# → redirects to /transcripts/cross/<runId>
```

---

## 7. Recovery commands

| Symptom | Command |
|---|---|
| Transcripts stuck in "Processing" forever | Check Vercel logs for `/api/ingest/gcs-event`. If 504s, see #5.1/#5.10. |
| Old `error.json` lingers after a successful re-run | `gcloud storage rm gs://squareup-transcripts-dev/results/<id>.error.json` |
| Want to reprocess a single transcript | `gcloud storage cp gs://squareup-transcripts-dev/inbox/<id>.txt gs://squareup-transcripts-dev/inbox/<id>.txt` (overwrite triggers fresh notification) — only works if the result.json is also deleted first |
| Subscription muted by far-future seek | `gcloud pubsub subscriptions seek transcript-uploaded-dev-vercel --time=<recent-RFC3339-timestamp> --project=squareup-492617` |
| Need to drain backlog now | Same seek command with `--time=<now-RFC3339>` |
| Stop ingest entirely (cost emergency) | `gcloud pubsub subscriptions delete transcript-uploaded-dev-vercel --project=squareup-492617` (recreate later with the create command in §2.8) |
| Rotate the SA key | Sequence in §2.7: disable constraint → create new key → re-enable constraint → update Vercel env var → redeploy → revoke old key |

---

## 8. Files in this branch

```
services/insight-service/
├── app/                              Next.js App Router
│   ├── page.tsx                      Existing /synthesis demo
│   ├── transcripts/                  NEW — production view
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── cross/[runId]/page.tsx
│   └── api/
│       ├── synthesize/route.ts       Existing live-demo endpoint
│       ├── health/route.ts           Diagnostics
│       ├── ingest/gcs-event/route.ts NEW — Pub/Sub push handler
│       └── transcripts/
│           ├── route.ts              GET list
│           ├── [id]/route.ts         GET detail
│           ├── aggregate/route.ts    NEW — cross-transcript trigger
│           └── cross/[runId]/route.ts NEW — fetch cross-run
├── components/                       UI components, unchanged from v2 demo
├── lib/
│   ├── prompts/                      6 agent system prompts (unchanged)
│   ├── agents.ts                     Updated: cost-cut + parse retry
│   ├── pipeline.ts                   Client-side pipeline (live-demo path)
│   ├── pipeline-server.ts            NEW — server-side pipeline for ingest
│   ├── gcs.ts                        NEW — GCS wrapper
│   ├── pubsub-auth.ts                NEW — OIDC verifier
│   ├── verify.ts                     Span verifier with auto-correction
│   ├── aggregate.ts                  Cross-transcript clustering
│   └── types.ts                      Shared TS types
├── public/
│   └── fixtures/                     Pre-cached pipeline outputs (Playback mode)
├── sample-run/
│   ├── run_pipeline.py               Python validator (Stage-1 reference)
│   └── transcripts/T1.txt            Wildstone sample
├── INSIGHT_SERVICE.md                THIS FILE
├── README.md                         Local-dev + service overview
├── DEPLOY.md                         Vercel deploy walkthrough
├── package.json                      Adds @google-cloud/storage + google-auth-library
├── vercel.json                       region=bom1, maxDuration=60
└── .env.local.example                Template for local-dev env vars
```

---

## 9. What's NOT yet done

Items that would naturally come next but are **not in this branch**:

- **Move from Vercel to Cloud Run** for the ingest endpoint (relieves the 60s timeout, fixes #5.1)
- **Workload Identity Federation** (kills the JSON key, fixes #5.4)
- **Dead-letter queue** on the push subscription (fixes #5.3)
- **Cross-runs list page** (fixes #5.8)
- **Real-time UI updates** via Firestore or SSE (fixes #5.9)
- **Wire the production post-execution-service to write transcripts to GCS** so this whole pipeline starts working off real Bolna calls instead of manual gsutil uploads
- **Brand-tenanted bucket layout** (`gs://squareup-transcripts-{env}/{brand}/inbox/`) — currently single-tenant
- **Auth gating on the public UI** (`/transcripts` is currently public; should be brand-token-gated before showing real customer data)

These are the deltas to track between "demo working end-to-end" and
"production-grade for paying brands."
