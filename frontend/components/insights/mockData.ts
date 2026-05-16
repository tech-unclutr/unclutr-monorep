// Type definitions for the insights module.
//
// Every field here is named exactly as it appears in the GCS insights JSON
// (= `ServerPipelineResult` from services/insight-service/lib/types.ts). The UI
// renders only what's in the JSON — no derived priorities, no rounded values,
// no fabricated copy. If a field isn't in the JSON, the UI doesn't render it.

export type TranscriptStatus = "pending" | "done" | "failed";

export interface TranscriptSummary {
    id: string;
    name: string;
    status: TranscriptStatus;
    ingested_at: string;
    duration_minutes: number;
    persona: string;
}
// Back-compat alias for the TranscriptsList component.
export type MockTranscript = TranscriptSummary;

export interface EvidenceItem {
    transcript_id?: string | null;
    speaker?: string | null;       // "user" | "assistant" — raw, lowercased
    start_char?: number | null;
    end_char?: number | null;
    verbatim: string;
    source_theme_id?: string | null;
    source_theme_confidence?: number | null;
}

export interface ContradictionClaim {
    label?: string | null;
    speaker?: string | null;
    start_char?: number | null;
    end_char?: number | null;
    verbatim: string;
    summary_role?: string | null;
}

export interface ContradictionItem {
    type?: string | null;
    summary?: string | null;
    claim_a?: ContradictionClaim | null;
    claim_b?: ContradictionClaim | null;
    rationale?: string | null;
    confidence?: string | null;
    actionability_hint?: string | null;
    transcript_id?: string | null;
}

export interface SourceTheme {
    transcript_id?: string | null;
    theme_id?: string | null;
    theme_name?: string | null;
}

export interface DebateProposal {
    agent: string;                              // conservative | aggressive | balanced
    theme_name?: string | null;
    executive_summary?: string | null;
    recommended_action_framing?: string | null;
    evidence_emphasis?: string | null;
}

export interface JudgeScores {
    evidence: number;
    actionability: number;
    impact: number;
    specificity: number;
    total: number;
}

export interface DebateBundle {
    winner: string;
    proposals: DebateProposal[];
    scores: Record<string, JudgeScores>;
    judge_reasoning?: string | null;
}

export interface ActionItem {
    action_id?: string | null;
    owner_team?: string | null;
    action_text?: string | null;
    deadline?: string | null;
    context_for_team?: string | null;
    expected_impact?: string | null;
    priority?: string | null;
    confidence?: string | null;
}

// Mirrors AggregatedInsight from the GCS file + joined sibling sections.
export interface InsightItem {
    insight_id: string;
    theme_name: string;
    category?: string | null;
    transcripts_mentioning: string[];
    transcripts_total?: number | null;
    frequency_pct?: number | null;
    total_mentions?: number | null;
    emotional_valence_majority?: string | null;
    severity_distribution: number[];
    avg_severity?: number | null;
    max_severity?: number | null;
    min_severity?: number | null;
    modal_urgency?: string | null;
    impact_score?: number | null;
    evidence_pool: EvidenceItem[];
    source_themes: SourceTheme[];
    contradictions: ContradictionItem[];
    action?: ActionItem | null;
    debate?: DebateBundle | null;
}

// Back-compat alias for the older import name used by TranscriptDetail.
// (TranscriptDetail will be updated to use InsightItem directly.)
export type MockInsight = InsightItem;

export function formatRelative(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHr < 1) return "just now";
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}
