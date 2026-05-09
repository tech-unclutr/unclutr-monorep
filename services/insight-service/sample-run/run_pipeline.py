"""
Validation runner: runs the SquareUp synthesis pipeline (the skill) on a sample
transcript end-to-end via real Anthropic API calls. Captures all intermediate
JSON outputs as cached fixtures for the demo's playback mode.

Usage:
    set ANTHROPIC_API_KEY=...
    python run_pipeline.py
"""
from __future__ import annotations

import asyncio
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import anthropic

SKILL_DIR = Path(r"C:/Users/nimay/.claude/skills/squareup-synthesis")
RUN_DIR = Path(__file__).resolve().parent
TRANSCRIPTS_DIR = RUN_DIR / "transcripts"
EXTRACTOR_DIR = RUN_DIR / "extractor"
CONTRADICTION_DIR = RUN_DIR / "contradiction"
SEVERITY_DIR = RUN_DIR / "severity"
AGGREGATED_DIR = RUN_DIR / "aggregated"
ACTIONS_DIR = RUN_DIR / "actions"
FINAL_DIR = RUN_DIR / "final"

for d in (EXTRACTOR_DIR, CONTRADICTION_DIR, SEVERITY_DIR, AGGREGATED_DIR, ACTIONS_DIR, FINAL_DIR):
    d.mkdir(parents=True, exist_ok=True)

ORCHESTRATOR_MODEL = "claude-opus-4-5-20250929"  # Fall back to a published id; will adjust if needed
WORKER_MODEL = "claude-sonnet-4-5-20250929"


def load_prompt(name: str) -> str:
    return (SKILL_DIR / "prompts" / f"{name}.md").read_text(encoding="utf-8")


def load_transcript(path: Path) -> tuple[str, str]:
    return path.stem, path.read_text(encoding="utf-8")


def extract_json(text: str):
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fenced:
        try:
            return json.loads(fenced.group(1).strip())
        except json.JSONDecodeError:
            pass
    bare = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if bare:
        return json.loads(bare.group(0))
    raise ValueError(f"No JSON found in:\n{text[:500]}")


async def call_agent(client, system_prompt: str, user_prompt: str, model: str, max_tokens: int = 4096):
    """Single agent invocation. Returns parsed JSON."""
    msg = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    text = "".join(b.text for b in msg.content if hasattr(b, "text"))
    return extract_json(text), {
        "input_tokens": msg.usage.input_tokens,
        "output_tokens": msg.usage.output_tokens,
        "model": model,
    }


def verify_step(transcript_path: Path, output_path: Path, kind: str) -> bool:
    """Run the skill's verify_spans.py."""
    result = subprocess.run(
        [sys.executable, str(SKILL_DIR / "scripts" / "verify_spans.py"),
         "--transcript", str(transcript_path),
         "--output", str(output_path),
         "--type", kind, "--quiet"],
        capture_output=True, text=True,
    )
    print(f"  verify {kind:14s} {output_path.name}: {result.stdout.strip()}")
    if result.returncode != 0:
        print(f"  stderr: {result.stderr}", file=sys.stderr)
    return result.returncode == 0


async def run_per_transcript(client, transcript_id: str, transcript_text: str, prompts: dict):
    print(f"\n=== Processing {transcript_id} ({len(transcript_text)} chars) ===")
    total_tokens = {"input_tokens": 0, "output_tokens": 0}

    # Step 1: Extractor
    print("[1/3] Extractor...")
    out, usage = await call_agent(
        client, prompts["extractor"],
        f"TRANSCRIPT (transcript_id: {transcript_id}):\n\n{transcript_text}",
        ORCHESTRATOR_MODEL, max_tokens=6000,
    )
    out["transcript_id"] = transcript_id
    extractor_path = EXTRACTOR_DIR / f"{transcript_id}.json"
    extractor_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    total_tokens["input_tokens"] += usage["input_tokens"]
    total_tokens["output_tokens"] += usage["output_tokens"]
    print(f"  -> {len(out.get('themes', []))} themes ({usage['input_tokens']} in / {usage['output_tokens']} out)")
    if not verify_step(TRANSCRIPTS_DIR / f"{transcript_id}.txt", extractor_path, "extractor"):
        print("  WARNING: extractor verification failed; consider regenerating.")

    extractor_out = out

    # Step 2: Contradiction Detector
    print("[2/3] Contradiction Detector...")
    contra_input = (
        f"TRANSCRIPT (transcript_id: {transcript_id}):\n\n{transcript_text}\n\n"
        f"EXTRACTOR OUTPUT (themes already identified):\n{json.dumps(extractor_out, indent=2, ensure_ascii=False)}"
    )
    out, usage = await call_agent(
        client, prompts["contradiction"], contra_input,
        ORCHESTRATOR_MODEL, max_tokens=4000,
    )
    out["transcript_id"] = transcript_id
    contra_path = CONTRADICTION_DIR / f"{transcript_id}.json"
    contra_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    total_tokens["input_tokens"] += usage["input_tokens"]
    total_tokens["output_tokens"] += usage["output_tokens"]
    print(f"  -> {len(out.get('contradictions', []))} contradictions ({usage['input_tokens']} in / {usage['output_tokens']} out)")
    if not verify_step(TRANSCRIPTS_DIR / f"{transcript_id}.txt", contra_path, "contradiction"):
        print("  WARNING: contradiction verification failed.")

    # Step 3: Severity Calibrator
    print("[3/3] Severity Calibrator...")
    sev_input = (
        f"TRANSCRIPT (transcript_id: {transcript_id}):\n\n{transcript_text}\n\n"
        f"EXTRACTOR OUTPUT (themes to score):\n{json.dumps(extractor_out, indent=2, ensure_ascii=False)}"
    )
    out, usage = await call_agent(
        client, prompts["severity"], sev_input,
        WORKER_MODEL, max_tokens=4000,
    )
    out["transcript_id"] = transcript_id
    sev_path = SEVERITY_DIR / f"{transcript_id}.json"
    sev_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    total_tokens["input_tokens"] += usage["input_tokens"]
    total_tokens["output_tokens"] += usage["output_tokens"]
    print(f"  -> {len(out.get('scores', []))} scored ({usage['input_tokens']} in / {usage['output_tokens']} out)")
    if not verify_step(TRANSCRIPTS_DIR / f"{transcript_id}.txt", sev_path, "severity"):
        print("  WARNING: severity verification failed.")

    return total_tokens


async def main():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    client = anthropic.AsyncAnthropic()

    # Probe model — try the configured ID, fall back if needed
    global ORCHESTRATOR_MODEL, WORKER_MODEL
    candidates_orch = ["claude-opus-4-5-20250929", "claude-opus-4-5", "claude-3-5-sonnet-20241022", "claude-3-5-sonnet-latest"]
    candidates_worker = ["claude-sonnet-4-5-20250929", "claude-3-5-sonnet-20241022", "claude-3-5-sonnet-latest", "claude-3-5-haiku-20241022"]

    async def probe(model_list, label):
        for m in model_list:
            try:
                _ = await client.messages.create(
                    model=m, max_tokens=10,
                    messages=[{"role": "user", "content": "say ok"}]
                )
                return m
            except anthropic.NotFoundError:
                continue
            except Exception as e:
                print(f"  probe {m}: {e}")
                continue
        raise RuntimeError(f"No working {label} model found")

    print("Probing models...")
    ORCHESTRATOR_MODEL = await probe(candidates_orch, "orchestrator")
    WORKER_MODEL = await probe(candidates_worker, "worker")
    print(f"  orchestrator: {ORCHESTRATOR_MODEL}")
    print(f"  worker:       {WORKER_MODEL}")

    # Load prompts
    prompts = {
        "extractor": load_prompt("extractor"),
        "contradiction": load_prompt("contradiction"),
        "severity": load_prompt("severity"),
        "action": load_prompt("action"),
    }

    # Load transcripts
    transcripts = []
    for path in sorted(TRANSCRIPTS_DIR.glob("*.txt")):
        tid, content = load_transcript(path)
        transcripts.append((tid, content))
    print(f"\nLoaded {len(transcripts)} transcript(s)")

    # Run per-transcript pipeline
    grand_total = {"input_tokens": 0, "output_tokens": 0}
    for tid, content in transcripts:
        usage = await run_per_transcript(client, tid, content, prompts)
        grand_total["input_tokens"] += usage["input_tokens"]
        grand_total["output_tokens"] += usage["output_tokens"]

    # Run aggregator (deterministic)
    print("\n=== Aggregating ===")
    result = subprocess.run(
        [sys.executable, str(SKILL_DIR / "scripts" / "aggregate.py"),
         "--run-dir", str(RUN_DIR)],
        capture_output=True, text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(1)

    # Run action composer
    print("\n=== Action Composer ===")
    aggregated = json.loads((AGGREGATED_DIR / "insights.json").read_text(encoding="utf-8"))
    action_input = (
        f"AGGREGATED INSIGHTS (input from cross-transcript clustering):\n"
        f"{json.dumps(aggregated, indent=2, ensure_ascii=False)}\n\n"
        f"BRAND CONTEXT: Wildstone (men's grooming, India, mid-market)"
    )
    out, usage = await call_agent(
        client, prompts["action"], action_input,
        ORCHESTRATOR_MODEL, max_tokens=4000,
    )
    actions_path = ACTIONS_DIR / "actions.json"
    actions_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    grand_total["input_tokens"] += usage["input_tokens"]
    grand_total["output_tokens"] += usage["output_tokens"]
    print(f"  -> {len(out.get('actions', []))} actions ({usage['input_tokens']} in / {usage['output_tokens']} out)")

    # Verify actions
    result = subprocess.run(
        [sys.executable, str(SKILL_DIR / "scripts" / "verify_actions.py"),
         "--actions", str(actions_path),
         "--insights", str(AGGREGATED_DIR / "insights.json"),
         "--quiet"],
        capture_output=True, text=True,
    )
    print(f"  verify actions: {result.stdout.strip()}")

    # Render
    print("\n=== Rendering report ===")
    result = subprocess.run(
        [sys.executable, str(SKILL_DIR / "scripts" / "render.py"),
         "--run-dir", str(RUN_DIR),
         "--brand", "Wildstone"],
        capture_output=True, text=True,
    )
    print(result.stdout)

    # Cost estimate (very rough — Sonnet 4.5 ~$3 / 1M in, $15 / 1M out)
    in_cost = grand_total["input_tokens"] / 1_000_000 * 3.0
    out_cost = grand_total["output_tokens"] / 1_000_000 * 15.0
    print(f"\n=== TOTAL TOKENS ===")
    print(f"  input:  {grand_total['input_tokens']:,}  (~${in_cost:.3f})")
    print(f"  output: {grand_total['output_tokens']:,}  (~${out_cost:.3f})")
    print(f"  total estimate: ~${in_cost + out_cost:.3f}")
    print(f"\nFinal report: {FINAL_DIR / 'report.md'}")


if __name__ == "__main__":
    asyncio.run(main())
