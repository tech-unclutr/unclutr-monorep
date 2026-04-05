"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { LeadPipeline } from "./LeadPipeline";
import { ExecutionEngine } from "./ExecutionEngine";
import { ActivityStream } from "./ActivityStream";
import {
    COHORT_META,
    type Lead,
    type Agent,
    type ActivityEntry,
    type InterviewDuration,
} from "./types";

interface VoiceSandboxProps {
    className?: string;
}

const POLL_INTERVAL_MS = 1_500;
const DURATIONS: InterviewDuration[] = [15, 30, 60];

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
        name: raw.name,
        company: raw.company,
        score: raw.score,
        cohort: raw.cohort,
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

export function VoiceSandbox({ className }: VoiceSandboxProps) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [activity, setActivity] = useState<ActivityEntry[]>([]);
    const [pipelineCounts, setPipelineCounts] = useState<Record<InterviewDuration, number>>({ 15: 0, 30: 0, 60: 0 });
    const [running, setRunning] = useState(false);
    const [loading, setLoading] = useState(true);

    const pollRef = useRef<NodeJS.Timeout | null>(null);

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

    useEffect(() => {
        async function fetchInitial() {
            try {
                // Always reset on mount to get a clean initial state
                const data = await api.request("/voice-sandbox/reset", { method: "POST" });
                applyState(data);
            } catch (err) {
                console.error("[VoiceSandbox] Failed to fetch initial state:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchInitial();
    }, [applyState]);

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
            const data = await api.request("/voice-sandbox/start", { method: "POST" });
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
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                            Reset
                        </button>

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
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Activity Stream — full width */}
                    <ActivityStream entries={activity} />
                </div>
            </div>
        </div>
    );
}
