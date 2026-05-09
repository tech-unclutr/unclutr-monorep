"use client";

import { useState } from "react";
import type { AggregatedInsight, Action, DebateResult, DebateAgent } from "@/lib/types";
import { FeedbackWidget } from "./FeedbackWidget";

const TEAM_DISPLAY: Record<string, string> = {
  product: "Product", cx: "CX", growth: "Growth",
  marketing: "Marketing", engineering: "Engineering", leadership: "Leadership",
};
const TEAM_COLOR: Record<string, string> = {
  product: "bg-purple-100 text-purple-700",
  cx: "bg-blue-100 text-blue-700",
  growth: "bg-green-100 text-green-700",
  marketing: "bg-pink-100 text-pink-700",
  engineering: "bg-amber-100 text-amber-700",
  leadership: "bg-gray-200 text-gray-700",
};
const URGENCY_COLOR: Record<string, string> = {
  immediate: "text-signal-red", high: "text-signal-amber",
  medium: "text-yellow-600", low: "text-signal-green",
};
const PRIORITY_COLOR: Record<string, string> = {
  P0: "bg-signal-red text-white",
  P1: "bg-signal-amber text-white",
  P2: "bg-yellow-500 text-white",
  P3: "bg-ink-300 text-ink-700",
};
const AGENT_LABEL: Record<DebateAgent, string> = {
  conservative: "Conservative",
  aggressive: "Aggressive",
  balanced: "Balanced",
};

function severityColor(sev: number | null): string {
  if (sev === null) return "bg-ink-300";
  if (sev >= 9) return "bg-signal-red";
  if (sev >= 7) return "bg-signal-amber";
  if (sev >= 5) return "bg-yellow-500";
  return "bg-signal-green";
}

export function InsightCard({
  rank, insight, action, debate, onRegenerate, regenerating,
}: {
  rank: number;
  insight: AggregatedInsight;
  action?: Action;
  debate?: DebateResult;
  onRegenerate?: (insightId: string, note: string) => void;
  regenerating?: boolean;
}) {
  const [showDebate, setShowDebate] = useState(false);
  const sev = insight.avg_severity;
  const sevPercent = sev ? (sev / 10) * 100 : 0;

  // Use debate winner's framing if available, else fall back to original
  const winningProposal = debate?.proposals.find(p => p.agent === debate.winner);
  const displayedTheme = winningProposal?.theme_name ?? insight.theme_name;
  const displayedSummary = winningProposal?.executive_summary;

  return (
    <div className="card card-hover p-6 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-ink-400">#{String(rank).padStart(2, "0")}</span>
          <span className="pill bg-ink-100 text-ink-600 capitalize">{insight.category.replace(/_/g, " ")}</span>
          {insight.contradictions_referenced.length > 0 && (
            <span className="pill bg-purple-100 text-purple-700">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />
              Contradiction
            </span>
          )}
          {debate && (
            <span className="pill bg-accent-50 text-accent-700">
              {AGENT_LABEL[debate.winner]} won ({debate.scores[debate.winner].total}/100)
            </span>
          )}
        </div>
        {action && <span className={`pill ${PRIORITY_COLOR[action.priority]}`}>{action.priority}</span>}
      </div>

      <h3 className="text-lg font-semibold text-ink-900 mb-3 leading-snug">{displayedTheme}</h3>

      {displayedSummary && (
        <p className="text-sm text-ink-700 mb-4 leading-relaxed">{displayedSummary}</p>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Severity</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-ink-900">{sev?.toFixed(1) ?? "—"}</span>
            <span className="text-xs text-ink-400">/ 10</span>
            {insight.max_severity !== null && insight.max_severity !== insight.avg_severity && (
              <span className="text-xs text-ink-400">peak {insight.max_severity}</span>
            )}
          </div>
          <div className="severity-bar mt-1.5">
            <div className={`severity-bar-fill ${severityColor(sev)}`} style={{ width: `${sevPercent}%` }} />
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Frequency</div>
          <div className="text-xl font-semibold text-ink-900">
            {insight.transcripts_mentioning.length}<span className="text-ink-400 font-normal">/{insight.transcripts_total}</span>
          </div>
          <div className="text-xs text-ink-500 mt-0.5">{(insight.frequency_pct * 100).toFixed(0)}% of interviews</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Urgency</div>
          <div className={`text-xl font-semibold capitalize ${URGENCY_COLOR[insight.modal_urgency ?? ""] ?? "text-ink-900"}`}>
            {insight.modal_urgency ?? "—"}
          </div>
          <div className="text-xs text-ink-500 mt-0.5 capitalize">{insight.emotional_valence_majority}</div>
        </div>
      </div>

      {/* Evidence */}
      {insight.evidence_pool.length > 0 && (
        <div className="mb-5">
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>Evidence</span>
            <span className="pill bg-signal-green/10 text-signal-green">verified verbatim</span>
          </div>
          <div className="space-y-2.5">
            {insight.evidence_pool.slice(0, 3).map((q, i) => (
              <div key={i} className="quote-block py-1">
                <p className="text-sm">&ldquo;{q.verbatim}&rdquo;</p>
                <p className="text-xs text-ink-400 mt-1 not-italic">
                  — {q.speaker === "user" ? "Customer" : "Interviewer"}, transcript {q.transcript_id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contradictions */}
      {insight.contradictions_referenced.length > 0 && (
        <div className="mb-5 p-4 bg-purple-50 border border-purple-100 rounded-lg">
          <div className="text-xs text-purple-700 font-semibold uppercase tracking-wider mb-2">
            Hidden contradiction
          </div>
          {insight.contradictions_referenced.slice(0, 1).map((c, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm text-ink-800">{c.summary}</p>
              {c.rationale && <p className="text-xs text-ink-600 mt-1">{c.rationale}</p>}
              {c.actionability_hint && (
                <p className="text-xs text-purple-700 mt-2 font-medium">→ {c.actionability_hint}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      {action ? (
        <div className="border-t border-ink-100 pt-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs text-ink-500 uppercase tracking-wider">Recommended action</span>
            <span className={`pill ${TEAM_COLOR[action.owner_team] ?? "bg-ink-100 text-ink-700"}`}>
              {TEAM_DISPLAY[action.owner_team] ?? action.owner_team}
            </span>
            <span className="pill bg-ink-100 text-ink-600">by {action.deadline}</span>
          </div>
          <p className="text-sm text-ink-900 mb-2">
            {winningProposal?.recommended_action_framing ?? action.action_text}
          </p>
          {action.expected_impact && (
            <p className="text-xs text-ink-500 italic">→ {action.expected_impact}</p>
          )}
        </div>
      ) : (
        <div className="border-t border-ink-100 pt-3">
          <p className="text-xs text-ink-400 italic">No action composed (filtered as low-impact)</p>
        </div>
      )}

      {/* Debate transparency */}
      {debate && (
        <div className="mt-4 pt-4 border-t border-ink-100">
          <button
            onClick={() => setShowDebate(!showDebate)}
            className="text-xs text-ink-500 hover:text-ink-900 flex items-center gap-1"
          >
            <span>{showDebate ? "▾" : "▸"}</span>
            3-agent debate {showDebate ? "(hide)" : "(view scoring)"}
          </button>
          {showDebate && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(["conservative", "aggressive", "balanced"] as DebateAgent[]).map(agent => {
                  const isWinner = debate.winner === agent;
                  const scores = debate.scores[agent];
                  return (
                    <div
                      key={agent}
                      className={
                        "rounded-lg border p-3 " +
                        (isWinner ? "border-accent-500 bg-accent-50" : "border-ink-200 bg-white")
                      }
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-ink-700">{AGENT_LABEL[agent]}</span>
                        {isWinner && <span className="text-xs text-accent-700 font-bold">★</span>}
                      </div>
                      <div className="text-lg font-bold text-ink-900">{scores.total}<span className="text-xs text-ink-400 font-normal">/100</span></div>
                      <div className="text-xs text-ink-500 mt-1 leading-tight">
                        E:{scores.evidence} A:{scores.actionability} I:{scores.impact} S:{scores.specificity}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-ink-600 italic">
                <strong>Judge:</strong> {debate.judge_reasoning}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      <FeedbackWidget
        insightId={insight.insight_id}
        onRegenerate={onRegenerate ? (note) => onRegenerate(insight.insight_id, note) : undefined}
        regenerating={regenerating}
      />
    </div>
  );
}
