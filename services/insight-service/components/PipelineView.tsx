"use client";

import type { PipelineState, PipelineStage } from "@/lib/types";

type StageConfig = {
  id: "extracting" | "contradicting" | "severing" | "aggregating" | "debating" | "actioning";
  label: string;
  agentName: string;
  description: string;
  bullet: string;
};

const STAGES: StageConfig[] = [
  { id: "extracting",   label: "Extract",       agentName: "Grounded Extractor",      description: "Themes + verbatim spans",       bullet: "01" },
  { id: "contradicting",label: "Contradiction", agentName: "Contradiction Detector",  description: "Stated vs. revealed claims",    bullet: "02" },
  { id: "severing",     label: "Severity",      agentName: "Severity Calibrator",     description: "1-10 scoring with factors",     bullet: "03" },
  { id: "aggregating",  label: "Aggregate",     agentName: "Cross-transcript Cluster", description: "Deterministic + filter",       bullet: "04" },
  { id: "debating",     label: "Debate",        agentName: "3 Framers + Judge",       description: "Conservative · Aggressive · Balanced", bullet: "05" },
  { id: "actioning",    label: "Action",        agentName: "Action Composer",         description: "Routed actions + deadlines",    bullet: "06" },
];

const STAGE_ORDER: PipelineStage[] = ["idle", "extracting", "contradicting", "severing", "aggregating", "filtering", "debating", "actioning", "complete"];

function stageStatus(currentStage: PipelineStage, target: StageConfig["id"]): "pending" | "active" | "done" {
  // 'filtering' is a sub-step of 'aggregating' visually
  const norm = (s: PipelineStage): PipelineStage => s === "filtering" ? "aggregating" : s;
  const cur = STAGE_ORDER.indexOf(norm(currentStage));
  const tgt = STAGE_ORDER.indexOf(target);
  if (currentStage === "complete") return "done";
  if (currentStage === "error") return tgt < cur ? "done" : "pending";
  if (cur === tgt) return "active";
  if (cur > tgt) return "done";
  return "pending";
}

export function PipelineView({ state }: { state: PipelineState }) {
  const stage = state.progress.stage;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-ink-900">Pipeline</h3>
        <PipelineStatusBadge stage={stage} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {STAGES.map((s) => {
          const status = stageStatus(stage, s.id);
          return <StageCard key={s.id} cfg={s} status={status} />;
        })}
      </div>

      {state.progress.message && stage !== "idle" && stage !== "complete" && (
        <div className="text-xs text-ink-500 mb-3 italic">{state.progress.message}</div>
      )}

      {Object.keys(state.progress.perTranscript ?? {}).length > 0 && (
        <PerTranscriptTable state={state} />
      )}

      {state.error && (
        <div className="mt-4 p-3 bg-signal-red/5 border border-signal-red/20 rounded-lg text-sm text-signal-red">
          <strong>Error:</strong> {state.error}
        </div>
      )}
    </div>
  );
}

function PipelineStatusBadge({ stage }: { stage: PipelineStage }) {
  if (stage === "idle") return <span className="pill bg-ink-100 text-ink-600">Ready</span>;
  if (stage === "complete") return <span className="pill bg-signal-green/10 text-signal-green">Complete</span>;
  if (stage === "error") return <span className="pill bg-signal-red/10 text-signal-red">Error</span>;
  return (
    <span className="pill bg-accent-50 text-accent-700 animate-pulse-soft">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mr-1.5 animate-pulse" />
      Running
    </span>
  );
}

function StageCard({ cfg, status }: { cfg: StageConfig; status: "pending" | "active" | "done" }) {
  return (
    <div
      className={
        "relative rounded-lg border p-3 transition-all duration-300 " +
        (status === "active"
          ? "border-accent-500 bg-accent-50 shadow-sm"
          : status === "done"
          ? "border-ink-200 bg-white"
          : "border-ink-200 bg-ink-50 opacity-70")
      }
    >
      <div className="flex items-start justify-between mb-2">
        <span className={
          "text-xs font-mono " +
          (status === "active" ? "text-accent-700" : status === "done" ? "text-ink-500" : "text-ink-400")
        }>{cfg.bullet}</span>
        <StatusIcon status={status} />
      </div>
      <div className={
        "text-sm font-semibold " +
        (status === "active" ? "text-accent-700" : "text-ink-900")
      }>{cfg.label}</div>
      <div className="text-xs text-ink-500 mt-0.5">{cfg.agentName}</div>
      <div className="text-xs text-ink-400 mt-1">{cfg.description}</div>
      {status === "active" && (
        <div className="absolute inset-0 rounded-lg pointer-events-none shimmer-bg animate-shimmer" />
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: "pending" | "active" | "done" }) {
  if (status === "done") {
    return (
      <svg className="w-4 h-4 text-signal-green" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
      </svg>
    );
  }
  if (status === "active") {
    return (
      <svg className="w-4 h-4 text-accent-500 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 8a6 6 0 11-6-6" strokeLinecap="round" />
      </svg>
    );
  }
  return <div className="w-4 h-4 rounded-full bg-ink-200" />;
}

function PerTranscriptTable({ state }: { state: PipelineState }) {
  const tids = Object.keys(state.progress.perTranscript ?? {}).sort();
  return (
    <div className="border-t border-ink-100 pt-4 mt-4">
      <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
        Per-transcript progress
      </div>
      <div className="space-y-1.5">
        {tids.map(tid => {
          const t = state.progress.perTranscript![tid];
          return (
            <div key={tid} className="flex items-center gap-3 text-sm">
              <code className="font-mono text-xs text-ink-600 w-12">{tid}</code>
              <AgentDot label="Extractor"      status={t.extractor} />
              <AgentDot label="Contradiction"  status={t.contradiction} />
              <AgentDot label="Severity"       status={t.severity} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentDot({ label, status }: { label: string; status?: "running" | "done" | "verified" | "error" }) {
  const cls = !status ? "bg-ink-200"
    : status === "running" ? "bg-accent-500 animate-pulse"
    : status === "verified" ? "bg-signal-green"
    : status === "done" ? "bg-signal-amber"
    : "bg-signal-red";
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${cls}`} />
      <span className="text-xs text-ink-500">{label}</span>
    </div>
  );
}
