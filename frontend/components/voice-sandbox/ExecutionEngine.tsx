"use client";

import React, { useMemo } from "react";
import { Zap, Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentCard } from "./AgentCard";
import type { Agent, InterviewDuration, Lead } from "./types";

interface ExecutionEngineProps {
    agents: Agent[];
    leads: Lead[];
}

const DURATION_META: Record<InterviewDuration, {
    label: string;
    icon: typeof Zap;
    accent: string;
}> = {
    15: { label: "15-Min", icon: Zap, accent: "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
    30: { label: "30-Min", icon: Sparkles, accent: "text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10" },
    60: { label: "60-Min", icon: Settings, accent: "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10" },
};

const DURATIONS: InterviewDuration[] = [15, 30, 60];

export function ExecutionEngine({ agents, leads }: ExecutionEngineProps) {
    const leadsById = useMemo(
        () => Object.fromEntries(leads.map((l) => [l.id, l])),
        [leads],
    );

    const grouped = useMemo(() => {
        const map = new Map<InterviewDuration, Agent[]>();
        for (const d of DURATIONS) map.set(d, []);
        for (const agent of agents) {
            map.get(agent.duration)?.push(agent);
        }
        return map;
    }, [agents]);

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                Execution Engine
            </h2>

            <div className="grid grid-cols-3 gap-4">
                {DURATIONS.map((duration) => {
                    const meta = DURATION_META[duration];
                    const Icon = meta.icon;
                    const group = grouped.get(duration) ?? [];
                    const activeCount = group.filter((a) => a.status === "processing").length;

                    return (
                        <div key={duration} className="space-y-2.5">
                            {/* Group header */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center",
                                        meta.accent,
                                    )}>
                                        <Icon className="w-3 h-3" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight">
                                        {meta.label}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">
                                    {activeCount}/{group.length} active
                                </span>
                            </div>

                            {/* Agent cards stacked */}
                            <div className="space-y-2">
                                {group.map((agent) => (
                                    <AgentCard
                                        key={agent.id}
                                        agent={agent}
                                        currentLead={
                                            agent.currentLeadId
                                                ? leadsById[agent.currentLeadId] ?? null
                                                : null
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
