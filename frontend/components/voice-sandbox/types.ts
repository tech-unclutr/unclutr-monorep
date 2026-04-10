// ── Shared types for Voice Sandbox ──────────────────────────────────

export type LeadStatus = "waiting" | "processing" | "completed";

export type SentimentType = "Positive" | "Neutral" | "Negative";

export interface Lead {
    id: string;
    name: string;
    company: string;
    score: number;
    cohort: InterviewDuration;
    cohortName?: string;
    status: LeadStatus;
    /** Which agent is handling this lead (null = in pipeline) */
    assignedAgentId: string | null;
    sentiment?: SentimentType;
    completedAt?: number;
}

export type AgentStatus = "idle" | "processing";

export type CohortAccent = "emerald" | "violet" | "rose";

export type InterviewDuration = 15 | 30 | 60;

export interface Agent {
    id: string;
    name: string;
    role: string;
    duration: InterviewDuration;
    icon: "sparkles" | "settings" | "zap";
    accentColor: string; // tailwind ring/border color class
    status: AgentStatus;
    currentLeadId: string | null;
}

export interface ActivityEntry {
    id: string;
    leadId: string;
    leadName: string;
    leadCompany: string;
    sentiment: SentimentType;
    completedAt: number;
}

// ── Helper constants ───────────────────────────────────────────────

export const COHORT_META: Record<InterviewDuration, { label: string; accent: CohortAccent }> = {
    15: { label: "15-Min Screening", accent: "emerald" },
    30: { label: "30-Min Discovery", accent: "violet" },
    60: { label: "60-Min Deep Dive", accent: "rose" },
};
