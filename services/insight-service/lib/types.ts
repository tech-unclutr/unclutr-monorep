// Shared types for the synthesis pipeline. Mirrors JSON schemas in the skill.

export type Mode = "live" | "playback" | "production";

export type Speaker = "user" | "assistant";

export type Span = {
  start_char: number;
  end_char: number;
  verbatim: string;
  speaker?: Speaker;
};

export type EvidenceSpan = {
  speaker: Speaker;
  start_char: number;
  end_char: number;
  verbatim: string;
};

export type Theme = {
  theme_id: string;
  theme_name: string;
  category: string;
  evidence_spans: EvidenceSpan[];
  mention_count: number;
  emotional_valence: "negative" | "neutral" | "positive" | "mixed";
  confidence: number;
  first_mention_pos?: number;
};

export type ExtractorOutput = {
  transcript_id: string;
  language_mix: "english" | "hindi" | "hinglish" | "mixed" | "other";
  themes: Theme[];
  extraction_notes?: string;
};

export type Claim = {
  label: "stated" | "revealed" | "earlier" | "later";
  speaker: Speaker;
  start_char: number;
  end_char: number;
  verbatim: string;
  summary_role: string;
};

export type Contradiction = {
  type: "stated_vs_revealed" | "temporal_inconsistency" | "price_sensitivity" | "feature_importance" | "social_desirability";
  summary: string;
  claim_a: Claim;
  claim_b: Claim;
  rationale: string;
  confidence: "high" | "medium" | "low";
  actionability_hint?: string;
};

export type ContradictionOutput = {
  transcript_id: string;
  contradictions: Contradiction[];
};

export type SeverityScore = {
  theme_id: string;
  severity: number;
  urgency: "immediate" | "high" | "medium" | "low";
  factors: {
    frequency_signal: number;
    emotional_intensity: number;
    actionability: number;
    business_impact: number;
  };
  justification_span: {
    start_char: number;
    end_char: number;
    verbatim: string;
  };
  rationale: string;
};

export type SeverityOutput = {
  transcript_id: string;
  scores: SeverityScore[];
};

export type EvidenceQuote = {
  transcript_id: string;
  speaker?: Speaker;
  start_char: number;
  end_char: number;
  verbatim: string;
  source_theme_id?: string;
  source_theme_confidence?: number;
};

export type AggregatedInsight = {
  insight_id: string;
  theme_name: string;
  category: string;
  transcripts_mentioning: string[];
  transcripts_total: number;
  frequency_pct: number;
  total_mentions: number;
  emotional_valence_majority: string;
  severity_distribution: number[];
  avg_severity: number | null;
  max_severity: number | null;
  min_severity: number | null;
  modal_urgency: string | null;
  evidence_pool: EvidenceQuote[];
  source_themes: { transcript_id: string; theme_id: string; theme_name: string }[];
  contradictions_referenced: Array<Partial<Contradiction> & { transcript_id: string }>;
  impact_score: number;
};

export type AggregatedOutput = {
  metadata: {
    transcripts_processed: number;
    transcript_ids: string[];
    total_themes_found: number;
    themes_after_clustering: number;
    similarity_threshold: number;
    clustering_method?: "llm" | "jaccard";
    generated_at: string;
  };
  aggregated_insights: AggregatedInsight[];
};

export type Action = {
  action_id: string;
  owner_team: "product" | "cx" | "growth" | "marketing" | "engineering" | "leadership";
  supporting_insights: string[];
  action_text: string;
  deadline: string;
  context_for_team: string;
  expected_impact: string;
  priority: "P0" | "P1" | "P2" | "P3";
  confidence: "high" | "medium" | "low";
};

export type ActionsOutput = {
  actions: Action[];
  skipped_insights?: { insight_id: string; reason: string }[];
};

// ---- Multi-agent debate ----
export type DebateAgent = "conservative" | "aggressive" | "balanced";

export type DebateProposal = {
  agent: DebateAgent;
  theme_name: string;
  executive_summary: string;
  recommended_action_framing: string;
  evidence_emphasis: string;
};

export type JudgeScores = {
  evidence: number;       // 0-25
  actionability: number;  // 0-25
  impact: number;         // 0-25
  specificity: number;    // 0-25
  total: number;          // 0-100
};

export type DebateResult = {
  insight_id: string;
  proposals: DebateProposal[];
  scores: { conservative: JudgeScores; aggressive: JudgeScores; balanced: JudgeScores };
  winner: DebateAgent;
  judge_reasoning: string;
};

export type DebateOutput = {
  results: DebateResult[];
};

// ---- Per-insight feedback ----
export type FeedbackRating = "up" | "down" | null;

export type InsightFeedback = {
  insight_id: string;
  rating: FeedbackRating;
  note?: string;
  corrected_action_text?: string;
  timestamp: string;
};

// ---- Insight filters ----
export type Priority = "P0" | "P1" | "P2" | "P3";

export type InsightFilters = {
  topN: number;
  priorities: Priority[];
};

// ---- Pipeline progress events ----
export type PipelineStage =
  | "idle"
  | "extracting"
  | "contradicting"
  | "severing"
  | "aggregating"
  | "filtering"
  | "debating"
  | "actioning"
  | "complete"
  | "error";

export type PipelineProgress = {
  stage: PipelineStage;
  perTranscript?: Record<string, {
    extractor?: "running" | "done" | "verified" | "error";
    contradiction?: "running" | "done" | "verified" | "error";
    severity?: "running" | "done" | "verified" | "error";
  }>;
  message?: string;
  startedAt?: number;
  completedAt?: number;
};

// Total verification stats over a run (for trust panel)
export type RunVerification = {
  totalSpans: number;
  exact: number;
  autoCorrected: number;
  rejected: number;        // true hallucinations
  perStage: Record<string, { total: number; corrected: number; rejected: number }>;
};

export type PipelineState = {
  progress: PipelineProgress;
  extractor: Record<string, ExtractorOutput>;
  contradiction: Record<string, ContradictionOutput>;
  severity: Record<string, SeverityOutput>;
  aggregated: AggregatedOutput | null;
  filteredInsightIds: string[];          // selected by user filters
  debate: DebateOutput | null;
  actions: ActionsOutput | null;
  verification: RunVerification;
  error: string | null;
};
