"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, FileText, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { LeadPipeline } from "./LeadPipeline";
import { ExecutionEngine } from "./ExecutionEngine";
import { ActivityStream } from "./ActivityStream";
import { CallDetailsModal } from "./CallDetailsModal";
import {
    INTERVIEW_TYPE_LABELS,
    type InterviewTypeKey,
} from "@/lib/executionPromptTemplate";
import {
    COHORT_META,
    type Lead,
    type Agent,
    type ActivityEntry,
    type InterviewDuration,
} from "./types";

interface VoiceSandboxProps {
    className?: string;
    studyId?: string;
    initialCohortInterviewMap?: Record<string, number[]>;
}

const POLL_INTERVAL_MS = 1_500;
const DURATIONS: InterviewDuration[] = [15, 30, 60];

/** Maps InterviewBuilder audio buckets to interview durations. */
const BUCKET_TO_DURATION: Record<string, InterviewDuration> = {
    audioA: 15,
    audioB: 30,
    audioC: 60,
};

/** Reverse: duration → InterviewTypeKey for prompt lookup. */
const DURATION_TO_BUCKET: Record<number, InterviewTypeKey> = {
    15: "audioA",
    30: "audioB",
    60: "audioC",
};

// ── Map backend agent shape to frontend Agent type ─────────────────

function mapAgent(raw: any): Agent {
    const durationMeta: Record<number, { icon: Agent["icon"]; accentColor: string }> = {
        15: { icon: "zap", accentColor: "emerald" },
        30: { icon: "sparkles", accentColor: "violet" },
        60: { icon: "settings", accentColor: "rose" },
    };
    const meta = durationMeta[raw.duration] ?? durationMeta[15];

    return {
        id: raw.id,
        name: raw.name,
        role: raw.role,
        duration: raw.duration,
        icon: meta.icon,
        accentColor: meta.accentColor,
        status: raw.status === "processing" ? "processing" : "idle",
        currentLeadId: raw.currentLeadId ?? null,
    };
}

function mapLead(raw: any): Lead {
    return {
        id: raw.id,
        queueItemId: raw.queueItemId ?? undefined,
        name: raw.name,
        company: raw.company,
        score: raw.score,
        cohort: raw.cohort,
        cohortName: raw.cohortName ?? undefined,
        status: raw.status,
        assignedAgentId: raw.assignedAgentId ?? null,
        sentiment: raw.sentiment ?? undefined,
        completedAt: raw.completedAt ?? undefined,
    };
}

function mapActivity(raw: any): ActivityEntry {
    return {
        id: raw.id,
        leadId: raw.leadId,
        leadName: raw.leadName,
        leadCompany: raw.leadCompany,
        sentiment: raw.sentiment ?? "Neutral",
        completedAt: raw.completedAt,
    };
}

// ── Component ──────────────────────────────────────────────────────

export function VoiceSandbox({ className, studyId, initialCohortInterviewMap }: VoiceSandboxProps) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [activity, setActivity] = useState<ActivityEntry[]>([]);
    const [pipelineCounts, setPipelineCounts] = useState<Record<InterviewDuration, number>>({ 15: 0, 30: 0, 60: 0 });
    const [running, setRunning] = useState(false);
    const [loading, setLoading] = useState(true);

    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Per-cohort interview-bucket derivation (formerly read from RecruitmentContext)
    // was tied to InterviewBuilder. That has been severed; callers must now pass
    // initialCohortInterviewMap explicitly or the sandbox runs with no cohorts.
    const cohortInterviewMap = initialCohortInterviewMap ?? {};

    // ── Prompt modal state ─────────────────────────────────────────
    // The modal fetches the fully resolved prompt from the backend
    // (`/voice-sandbox/queue-item/{id}/resolved-prompt`) — no client-side
    // prompt building needed.

    const [promptModalLead, setPromptModalLead] = useState<Lead | null>(null);
    const [resolvedPrompt, setResolvedPrompt] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeCallLogId, setActiveCallLogId] = useState<string | null>(null);

    const handleLeadClick = useCallback((lead: Lead) => {
        setPromptModalLead(lead);
        setResolvedPrompt(null);
        setCopied(false);
    }, []);

    // Fetch the fully resolved prompt from the backend when the modal opens.
    // The backend substitutes every {runtime_var} using the lead's real data,
    // so what's shown here is byte-identical to what Bolna receives at call time.
    useEffect(() => {
        if (!promptModalLead?.queueItemId) {
            setResolvedPrompt(null);
            return;
        }
        let cancelled = false;
        api.request(`/voice-sandbox/queue-item/${promptModalLead.queueItemId}/resolved-prompt`)
            .then((data: any) => {
                if (!cancelled) setResolvedPrompt(data?.prompt ?? "");
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("[VoiceSandbox] Failed to fetch resolved prompt:", err);
                    setResolvedPrompt("");
                }
            });
        return () => { cancelled = true; };
    }, [promptModalLead]);

    // ── Apply backend state to local state ─────────────────────────

    const applyState = useCallback((data: any) => {
        if (!data) return;

        // Agents
        if (data.agents) {
            setAgents(data.agents.map(mapAgent));
        }

        // Activity
        if (data.activity) {
            setActivity(data.activity.map(mapActivity));
        }

        // Running
        if (typeof data.running === "boolean") {
            setRunning(data.running);
        }

        // Leads + pipeline counts from cohort buckets
        if (data.leads) {
            const allLeads: Lead[] = [];
            const counts: Record<InterviewDuration, number> = { 15: 0, 30: 0, 60: 0 };

            for (const d of DURATIONS) {
                const bucket = data.leads[d] || data.leads[String(d)];
                if (!bucket) continue;

                counts[d] = bucket.totalCount;

                for (const raw of [...bucket.waiting, ...bucket.processing, ...bucket.completed]) {
                    allLeads.push(mapLead(raw));
                }
            }

            setLeads(allLeads);
            setPipelineCounts(counts);
        }
    }, []);

    // ── Initial load ───────────────────────────────────────────────

    // ── Load leads into engine on mount (populates pipeline before Start) ──

    useEffect(() => {
        async function loadLeads() {
            if (!studyId || Object.keys(cohortInterviewMap).length === 0) {
                setLoading(false);
                return;
            }
            try {
                const data = await api.post(`/voice-sandbox/load/${studyId}`, {
                    cohort_interview_map: cohortInterviewMap,
                });
                applyState(data);
            } catch (err) {
                console.error("[VoiceSandbox] Failed to load leads:", err);
            } finally {
                setLoading(false);
            }
        }

        loadLeads();
    }, [studyId, cohortInterviewMap, applyState]);

    // ── Polling loop: tick the backend engine ──────────────────────

    useEffect(() => {
        if (!running) {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }

        const poll = async () => {
            try {
                const data = await api.request("/voice-sandbox/tick", { method: "POST" });
                applyState(data);
            } catch (err) {
                console.error("[VoiceSandbox] Tick failed:", err);
            }
        };

        pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
        // Fire first tick immediately
        poll();

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [running, applyState]);

    // ── Controls ───────────────────────────────────────────────────

    const handleStart = async () => {
        try {
            const data = await api.post("/voice-sandbox/start");
            applyState(data);
        } catch (err) {
            console.error("[VoiceSandbox] Start failed:", err);
        }
    };

    const handleStop = async () => {
        try {
            const data = await api.request("/voice-sandbox/stop", { method: "POST" });
            applyState(data);
        } catch (err) {
            console.error("[VoiceSandbox] Stop failed:", err);
        }
    };

    const handleReset = async () => {
        try {
            const data = await api.request("/voice-sandbox/reset", { method: "POST" });
            applyState(data);
        } catch (err) {
            console.error("[VoiceSandbox] Reset failed:", err);
        }
    };

    // ── Render ──────────────────────────────────────────────────────

    return (
        <div className={cn("h-full flex flex-col", className)}>
            <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
                {/* Header */}
                <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white dark:bg-zinc-900" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                Voice Sandbox
                            </h1>
                            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                Command Center
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Controls */}
                        {!running ? (
                            <button
                                onClick={handleStart}
                                className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                            >
                                Start
                            </button>
                        ) : (
                            <button
                                onClick={handleStop}
                                className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                            >
                                Pause
                            </button>
                        )}
                        {/* Status badge */}
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border",
                            running
                                ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10"
                                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900",
                        )}>
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                running ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600",
                            )} />
                            <span className={cn(
                                "text-[11px] font-bold uppercase tracking-wider",
                                running
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-zinc-500 dark:text-zinc-400",
                            )}>
                                {running ? "Live" : "Paused"}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white animate-spin" />
                            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Loading pipeline...</p>
                        </div>
                    </div>
                ) : null}
                <div className={cn("flex-1 min-h-0 overflow-y-auto scrollbar-subtle p-6 space-y-6", loading && "hidden")}>
                    {/* Execution Engine — full width */}
                    <ExecutionEngine agents={agents} leads={leads} />

                    {/* Lead Pipelines — three cohort queues side by side */}
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
                            Lead Pipeline
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            {DURATIONS.map((d) => {
                                const meta = COHORT_META[d];
                                const cohortLeads = leads.filter((l) => l.cohort === d);
                                return (
                                    <LeadPipeline
                                        key={d}
                                        leads={cohortLeads}
                                        totalCount={pipelineCounts[d]}
                                        cohortLabel={meta.label}
                                        cohortAccent={meta.accent}
                                        onLeadClick={handleLeadClick}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Activity Stream — full width */}
                    <ActivityStream
                        entries={activity}
                        onEntryClick={(entry) => setActiveCallLogId(entry.id)}
                    />
                </div>
            </div>

            {/* ── Lead Prompt Modal ─────────────────────────────────── */}
            {promptModalLead && (() => {
                const prompt = resolvedPrompt;
                const isLoading = resolvedPrompt === null;
                const bucket = DURATION_TO_BUCKET[promptModalLead.cohort];
                const label = bucket ? INTERVIEW_TYPE_LABELS[bucket] : `${promptModalLead.cohort}-Min`;

                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setPromptModalLead(null)}
                    >
                        <div
                            className="relative w-full max-w-2xl max-h-[80vh] mx-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                            {promptModalLead.name}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                            {promptModalLead.cohortName && (
                                                <span className="font-medium text-indigo-600 dark:text-indigo-400">{promptModalLead.cohortName}</span>
                                            )}
                                            {promptModalLead.cohortName && " · "}
                                            {label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {prompt && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(prompt);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                        >
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied ? "Copied" : "Copy"}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setPromptModalLead(null)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Prompt content */}
                            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle p-6">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-6 h-6 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white animate-spin mb-3" />
                                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                            Loading prompt...
                                        </p>
                                    </div>
                                ) : prompt ? (
                                    <pre className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                                        {prompt}
                                    </pre>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-3" />
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                            No prompt configured
                                        </p>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                            This cohort/interview type combination doesn't have a prompt assigned yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Activity Stream Call Details Modal ──────────────── */}
            <CallDetailsModal
                callLogId={activeCallLogId}
                onClose={() => setActiveCallLogId(null)}
            />
        </div>
    );
}
