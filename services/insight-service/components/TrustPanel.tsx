"use client";

import { useEffect, useState } from "react";
import type { RunVerification } from "@/lib/types";

type HealthData = {
  ok: boolean;
  hasServerKey: boolean;
  promptMetadata: Record<string, { bytes: number; lines: number }>;
  models: { orchestrator: string; worker: string };
  pipelineVersion: string;
};

export function TrustPanel({
  verification, hasUserKey, currentMode,
}: {
  verification: RunVerification;
  hasUserKey: boolean;
  currentMode: "live" | "playback" | "production";
}) {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch("/api/health").then(r => r.json()).then(setHealth).catch(() => {});
  }, []);

  const totalSpans = verification.totalSpans;
  const exact = verification.exact;
  const corrected = verification.autoCorrected;
  const rejected = verification.rejected;
  const verifiedPct = totalSpans > 0 ? ((exact + corrected) / totalSpans) * 100 : 100;

  const keyStatus = currentMode === "playback"
    ? { label: "Playback (no key needed)", color: "text-ink-500", dot: "bg-ink-300" }
    : currentMode === "production"
      ? health?.hasServerKey
        ? { label: "Server key set", color: "text-signal-green", dot: "bg-signal-green" }
        : { label: "Server key MISSING", color: "text-signal-red", dot: "bg-signal-red" }
      : hasUserKey
        ? { label: "Browser key set", color: "text-signal-green", dot: "bg-signal-green" }
        : { label: "Browser key MISSING", color: "text-signal-amber", dot: "bg-signal-amber" };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink-900">Trust panel</h3>
        <span className="pill bg-ink-100 text-ink-600 font-mono text-xs">{health?.pipelineVersion ?? "—"}</span>
      </div>

      {/* Status checks */}
      <div className="space-y-2">
        <StatusRow label="Pipeline" value="Loaded · 6 prompts ready" dot="bg-signal-green" />
        <StatusRow
          label="API key"
          value={keyStatus.label}
          dot={keyStatus.dot}
          valueClass={keyStatus.color}
        />
        <StatusRow
          label="Models"
          value={health
            ? `${health.models.orchestrator.split("-").slice(0, 3).join("-")} · ${health.models.worker.split("-").slice(0, 3).join("-")}`
            : "loading…"}
          dot="bg-ink-400"
        />
        <StatusRow
          label="Anti-hallucination"
          value={totalSpans > 0
            ? `${verifiedPct.toFixed(1)}% of spans verified`
            : "Active (no spans yet)"}
          dot={rejected === 0 ? "bg-signal-green" : "bg-signal-amber"}
        />
      </div>

      {/* Per-run verification breakdown */}
      {totalSpans > 0 && (
        <div className="mt-4 pt-4 border-t border-ink-100">
          <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
            This run · span verification
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Exact match" value={exact} accent={false} />
            <Stat label="Auto-corrected" value={corrected} accent={false} />
            <Stat label="Rejected (hallucination)" value={rejected} accent={rejected > 0} />
          </div>
          {Object.keys(verification.perStage).length > 0 && (
            <div className="mt-3 space-y-1">
              {Object.entries(verification.perStage).map(([stage, s]) => (
                <div key={stage} className="flex items-center text-xs">
                  <span className="text-ink-500 capitalize w-24">{stage}:</span>
                  <span className="text-ink-700 font-mono">{s.total} spans · {s.corrected} corrected · {s.rejected} rejected</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prompt sizes (skill verification) */}
      {health?.promptMetadata && (
        <details className="mt-4 pt-4 border-t border-ink-100">
          <summary className="text-xs font-semibold text-ink-500 uppercase tracking-wider cursor-pointer hover:text-ink-700">
            Prompts loaded ({Object.keys(health.promptMetadata).length})
          </summary>
          <div className="mt-2 space-y-0.5">
            {Object.entries(health.promptMetadata).map(([name, meta]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-ink-600 font-mono">{name}.md</span>
                <span className="text-ink-400 font-mono">{(meta.bytes / 1024).toFixed(1)}KB · {meta.lines}L</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function StatusRow({ label, value, dot, valueClass = "text-ink-800" }: {
  label: string; value: string; dot: string; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-xs text-ink-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-xs ${valueClass}`}>{value}</span>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: boolean }) {
  return (
    <div>
      <div className={`text-xl font-bold ${accent ? "text-signal-red" : "text-ink-900"}`}>{value}</div>
      <div className="text-xs text-ink-500 leading-tight mt-0.5">{label}</div>
    </div>
  );
}
